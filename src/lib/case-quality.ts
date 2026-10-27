import type { GeneratedCase, QualityReview, CaseFeedback } from "./case-contract";
import type { VarietyDraw } from "./case-variety";
import { allQuestions, type CaseDefinition } from "./case-model";

// Broad physical bounds, NOT normal ranges, triage cut-offs or a clinical score.
const bounds: Record<string, [number, number, string]> = {
  pulse: [0, 300, "/min"],
  respiration: [0, 100, "/min"],
  spo2: [0, 100, "%"],
  temperature: [25, 43, "°C"],
  gcs: [3, 15, ""],
  glucose: [0.1, 80, "mmol/L"],
  lactate: [0, 30, "mmol/L"],
};
export function unsupportedPrecision(text: string): boolean {
  return (
    /\b\d+(?:[.,]\d+)?\s*(?:mg|mikrogram|µg|mcg|IE|g)\b(?!\s*\/\s*(?:L|dL)\b)/i.test(text) ||
    /\b\d+(?:[.,]\d+)?\s*(?:ml|mmol)\s*\/\s*(?:kg|time|min)/i.test(text) ||
    /\b(?:gi|infunder|bolus|infusjon|væskestøt)\b[^.\n";]{0,60}\b\d+(?:[.,]\d+)?\s*(?:ml|liter)\b/i.test(
      text,
    ) ||
    /\b\d+(?:[.,]\d+)?\s*(?:ml|liter)\b[^.\n";]{0,35}\b(?:bolus|intravenøst|infusjon)/i.test(text)
  );
}
export function validateGenerated(
  g: GeneratedCase,
  draw: VarietyDraw,
  stageCount: number,
  allowedSources: readonly string[],
): string[] {
  const issues: string[] = [];
  if (g.ageYears < draw.minAge || g.ageYears > draw.maxAge)
    issues.push("Alder passer ikke til rammen.");
  if (g.stages.length !== stageCount) issues.push("Feil antall deler.");
  if (g.stages[0]?.setting !== draw.setting) issues.push("Startstedet avviker fra valgt ramme.");
  if (g.stages[0]?.elapsedMinutes !== 0) issues.push("Tidslinjen skal starte ved null.");
  const questionTexts = g.stages.flatMap((s) =>
    s.questions.map((q) => q.prompt.trim().toLocaleLowerCase("nb-NO")),
  );
  if (new Set(questionTexts).size !== questionTexts.length) issues.push("Gjentatte oppgaver.");
  if (unsupportedPrecision(JSON.stringify(g)))
    issues.push("Doseringspresisjon uten kontrollert dosegrunnlag.");
  const skills = new Set(g.stages.flatMap((s) => s.questions.map((q) => q.skill)));
  if (stageCount > 1 && !skills.has("reassessment"))
    issues.push("Forløpet mangler en eksplisitt revurderingsoppgave.");
  if (stageCount > 1 && skills.size < 3) issues.push("For liten variasjon i resonneringsoppgaver.");
  g.stages.forEach((stage, index) => {
    if (index > 0 && stage.elapsedMinutes <= g.stages[index - 1]!.elapsedMinutes)
      issues.push("Tidslinjen går ikke fremover.");
    if (new Set(stage.vitals.map((v) => v.id)).size !== stage.vitals.length)
      issues.push("Dupliserte målinger.");
    const hints = [stage.setting, ...stage.questions.map((q) => q.prompt)]
      .join(" ")
      .toLocaleLowerCase("nb-NO");
    if (g.diagnosisAliases.some((a) => hints.includes(a.toLocaleLowerCase("nb-NO"))))
      issues.push("Mulig diagnoselekkasje i overskrift eller spørsmål.");
    stage.vitals.forEach((v) => {
      if (v.id === "bp") {
        const match = /^(\d{2,3})\/(\d{1,3})$/.exec(v.value);
        if (
          !match ||
          Number(match[1]) <= Number(match[2]) ||
          Number(match[1]) > 300 ||
          Number(match[2]) < 10 ||
          v.unit !== "mmHg"
        )
          issues.push("Ugyldig blodtrykk/enhet.");
      } else {
        const range = bounds[v.id];
        const value = Number(v.value.replace(",", "."));
        if (
          !/^\d+(?:[.,]\d+)?$/.test(v.value) ||
          !range ||
          value < range[0] ||
          value > range[1] ||
          v.unit !== range[2] ||
          (v.id === "gcs" && !Number.isInteger(value))
        )
          issues.push(`Ugyldig ${v.id}/enhet.`);
      }
      if (v.id === "spo2" && !/romluft|oksygen|O₂|O2/i.test(v.note))
        issues.push("SpO₂ mangler oksygenkontekst.");
    });
    stage.questions.forEach((q) => {
      if (
        q.rubric.sourceIds.every((id) =>
          ["study-guide", "assignment-1", "assignment-2", "self-harm"].includes(id),
        )
      )
        issues.push("Vurderingsgrunnlaget har bare pedagogiske kilder, ikke faglig støtte.");
      if (
        new Set(q.rubric.sourceIds).size !== q.rubric.sourceIds.length ||
        q.rubric.sourceIds.some((id) => !allowedSources.includes(id))
      )
        issues.push("Ukjent eller gjentatt kilde i vurderingsgrunnlaget.");
    });
  });
  return [...new Set(issues)];
}
export function reviewPassed(review: QualityReview): boolean {
  return (
    review.issues.length === 0 &&
    Object.entries(review).every(([key, value]) => key === "issues" || value === true)
  );
}
export function validateFeedback(
  feedback: CaseFeedback,
  definition: CaseDefinition,
  answers: Record<string, string>,
  allowedSources: readonly string[],
): string[] {
  const issues: string[] = [];
  const questions = allQuestions(definition);
  if (
    feedback.questions.length !== questions.length ||
    new Set(feedback.questions.map((q) => q.questionId)).size !== questions.length
  )
    issues.push("Tilbakemeldingen dekker ikke alle oppgavene entydig.");
  // Student quotations may contain an unsafe dose that the feedback must critique.
  // The generated advice itself must still never introduce unchecked dosing.
  const advice = {
    ...feedback,
    questions: feedback.questions.map(({ evidence: _evidence, ...q }) => q),
  };
  if (unsupportedPrecision(JSON.stringify(advice)))
    issues.push("Tilbakemeldingen inneholder ukontrollert dosering.");
  for (const item of feedback.questions) {
    if (!questions.some((q) => q.id === item.questionId)) issues.push("Ukjent oppgave.");
    const answer = answers[item.questionId]?.trim() ?? "";
    if (item.evidence && !answer.includes(item.evidence))
      issues.push("Sitatet finnes ikke i besvarelsen.");
    if (answer && !item.evidence) issues.push("Besvart oppgave mangler konkret tekstbelegg.");
    if (!answer && (item.status !== "unanswered" || item.evidence || item.strengths.length))
      issues.push("Ubesvart oppgave gis vurdering som besvart.");
    if (answer && item.status === "unanswered") issues.push("Besvart oppgave regnes som ubesvart.");
    if (item.sourceIds.some((id) => !allowedSources.includes(id)))
      issues.push("Tilbakemeldingen viser til ukjent kilde.");
  }
  return issues;
}
export function caseSimilarity(a: CaseDefinition, b: CaseDefinition): number {
  const tokens = (d: CaseDefinition) =>
    new Set(
      d.parts
        .flatMap((p) => p.content.flatMap((c) => (c.type === "list" ? c.items : [c.text])))
        .join(" ")
        .toLocaleLowerCase("nb-NO")
        .match(/[a-zæøå]{4,}/g) ?? [],
    );
  const left = tokens(a),
    right = tokens(b);
  return (
    [...left].filter((t) => right.has(t)).length / Math.max(1, new Set([...left, ...right]).size)
  );
}
