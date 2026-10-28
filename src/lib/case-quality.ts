import type {
  GeneratedCase,
  QualityReview,
  CaseFeedback,
  ModelAnswer,
  BlindSolution,
} from "./case-contract";
import { validateBloodGas } from "./blood-gas";
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
  capillaryRefill: [0, 30, "s"],
  weight: [0.2, 500, "kg"],
};
export function validateGenerated(
  g: GeneratedCase,
  draw: VarietyDraw,
  stageCount: number,
  allowedSources: readonly string[],
): string[] {
  const issues: string[] = [];
  if (!/[.!?][»”")]?\s*$/.test(g.role))
    issues.push("Rollebeskrivelsen slutter med en ufullført setning.");
  if (g.ageYears < draw.minAge || g.ageYears > draw.maxAge)
    issues.push("Alder passer ikke til rammen.");
  if (g.stages.length !== stageCount) issues.push("Feil antall deler.");
  if (g.stages[0]?.setting !== draw.setting) issues.push("Startstedet avviker fra valgt ramme.");
  if (g.stages[0]?.elapsedMinutes !== 0) issues.push("Tidslinjen skal starte ved null.");
  const questionTexts = g.stages.flatMap((s) =>
    s.questions.map((q) => q.prompt.trim().toLocaleLowerCase("nb-NO")),
  );
  if (new Set(questionTexts).size !== questionTexts.length) issues.push("Gjentatte oppgaver.");
  if (stageCount === 1 && (g.stages[0]?.questions.length ?? 0) < 2)
    issues.push("Kortcasen trenger minst to spørsmål om tolkning og klinisk konsekvens.");
  if (draw.bloodGasRelevant && !g.stages.some((s) => s.bloodGas.length))
    issues.push("Den valgte rammen trenger en komplett blodgass.");
  const skills = new Set(g.stages.flatMap((s) => s.questions.map((q) => q.skill)));
  if (stageCount > 1 && skills.size < 3) issues.push("For liten variasjon i resonneringsoppgaver.");
  g.stages.forEach((stage, index) => {
    if (
      !Number.isInteger(stage.elapsedMinutes) ||
      (index > 0 && stage.elapsedMinutes < g.stages[index - 1]!.elapsedMinutes)
    )
      issues.push("Tidslinjen går ikke fremover.");
    if (new Set(stage.vitals.map((v) => v.id)).size !== stage.vitals.length)
      issues.push("Dupliserte målinger.");
    const ids = new Set(stage.vitals.map((v) => v.id));
    if (
      index === 0 &&
      (["bp", "pulse", "respiration", "spo2", "temperature"].some(
        (id) => !ids.has(id as GeneratedCase["stages"][number]["vitals"][number]["id"]),
      ) ||
        (!ids.has("gcs") && !ids.has("consciousness")))
    )
      issues.push("Vitale parametre er ufullstendige.");
    for (const event of [
      ...stage.medications,
      ...stage.laboratory,
      ...stage.bloodGas,
      ...stage.reports,
    ])
      if (!Number.isInteger(event.timeMinutes) || event.timeMinutes > stage.elapsedMinutes)
        issues.push("En observasjon, prøve eller legemiddelhendelse har ugyldig tidspunkt.");
    for (const gas of stage.bloodGas) issues.push(...validateBloodGas(gas));
    const labKeys = stage.laboratory.map((l) => `${l.id}:${l.sampleType}:${l.timeMinutes}`);
    if (new Set(labKeys).size !== labKeys.length) issues.push("Dupliserte laboratoriesvar.");
    for (const medicine of stage.medications)
      if (
        !medicine.sourceIds.length ||
        medicine.sourceIds.some((id) => !allowedSources.includes(id))
      )
        issues.push("Legemiddelopplysningene har ukjent kildegrunnlag.");
    // Diagnostic sufficiency and report wording are judged in the blind solve/review.
    // Literal alias matching would wrongly reject known disease and interpreted ECG.
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
      } else if (v.id === "consciousness") {
        if (!v.value.trim() || v.unit) issues.push("Bevissthet skal beskrives uten måleenhet.");
      } else {
        const range = bounds[v.id];
        const value = Number(v.value.replace(",", "."));
        if (
          !/^\d+(?:[.,]\d+)?$/.test(v.value) ||
          !range ||
          value < range[0] ||
          value > range[1] ||
          (v.unit !== range[2] && !(v.id === "gcs" && v.unit === "/15")) ||
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
  // Numerical case history and quotations are legitimate; clinical/source review
  // checks any new recommendations in context instead of banning all numbers.
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
export function validateModelAnswer(
  answer: ModelAnswer,
  definition: CaseDefinition,
  allowedSources: readonly string[],
): string[] {
  const ids = allQuestions(definition).map((q) => q.id);
  const issues: string[] = [];
  if (
    answer.questions.length !== ids.length ||
    new Set(answer.questions.map((q) => q.questionId)).size !== ids.length ||
    answer.questions.some((q) => !ids.includes(q.questionId))
  )
    issues.push("Modellbesvarelsen dekker ikke alle oppgavene entydig.");
  if (
    answer.questions.some(
      (q) => !q.sourceIds.length || q.sourceIds.some((id) => !allowedSources.includes(id)),
    )
  )
    issues.push("Modellbesvarelsen viser til ukjent eller manglende kilde.");
  return issues;
}
export function validateBlindSolution(
  solution: BlindSolution,
  definition: CaseDefinition,
): string[] {
  const ids = allQuestions(definition).map((q) => q.id);
  const issues: string[] = [];
  if (
    solution.questions.length !== ids.length ||
    new Set(solution.questions.map((q) => q.questionId)).size !== ids.length ||
    solution.questions.some((q) => !ids.includes(q.questionId))
  )
    issues.push("Den uavhengige løsningen dekker ikke alle oppgaver.");
  for (const q of solution.questions) {
    if (q.missingDecisiveData.length)
      issues.push("Oppgaven mangler avgjørende data: " + q.missingDecisiveData.join("; "));
    if (!q.requiresReasoning)
      issues.push("En oppgave krever bare avskrift, ikke klinisk resonnement.");
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
