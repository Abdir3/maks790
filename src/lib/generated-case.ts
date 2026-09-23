// Shapes shared between the generator server functions and the browser.
import type { CaseDefinition, CasePart, CaseQuestion, ContentBlock } from "./case-model";

export type CasePlan = {
  title: string;
  patient: string;
  specialty: string;
  diagnosisFamily: string;
  dossier: string;
  background: string[];
  stages: { title: string; shortTitle: string; focus: string }[];
};

export type GeneratedStage = {
  title: string;
  shortTitle: string;
  timeLabel: string;
  paragraphs: string[];
  quote: string;
  list: { title: string; items: string[] };
  vitals: {
    timestamp: string;
    values: { id: string; label: string; value: string; unit: string; note: string }[];
  };
  afterParagraphs: string[];
  questions: { label: string; prompt: string; subquestions: { label: string; prompt: string }[] }[];
};

export type GenerationMeta = {
  format: "long" | "quick";
  engine: string;
  presentation: string;
  setting: string;
  patientProfile: string;
};

function blocks(paragraphs: string[]): ContentBlock[] {
  return paragraphs.filter((text) => text.trim()).map((text) => ({ type: "paragraph", text }));
}

export function buildDefinition(
  caseId: string,
  plan: CasePlan,
  stages: GeneratedStage[],
): CaseDefinition {
  let questionNumber = 0;
  const parts = stages.map((stage, index) => {
    const partId = `${caseId}-del${index + 1}`;
    const content: ContentBlock[] = blocks(stage.paragraphs);
    if (stage.quote?.trim()) content.push({ type: "quote", text: stage.quote });
    if (stage.list?.items?.length)
      content.push(
        stage.list.title
          ? { type: "list", title: stage.list.title, items: stage.list.items }
          : { type: "list", items: stage.list.items },
      );

    const questions: CaseQuestion[] = (stage.questions ?? []).map((question) => {
      questionNumber += 1;
      const id = `${caseId}-q${questionNumber}`;
      if (question.subquestions?.length) {
        return {
          id,
          label: question.label || `Oppgave ${questionNumber}`,
          ...(question.prompt?.trim() ? { prompt: question.prompt } : {}),
          subquestions: question.subquestions.map((child, position) => ({
            id: `${id}${String.fromCharCode(97 + position)}`,
            label: child.label || `Oppgave ${questionNumber}${String.fromCharCode(97 + position)}`,
            prompt: child.prompt,
          })),
        };
      }
      return {
        id,
        label: question.label || `Oppgave ${questionNumber}`,
        prompt: question.prompt,
      };
    });

    const part: CasePart = {
      id: partId,
      title: stage.title,
      ...(stage.shortTitle?.trim() ? { shortTitle: stage.shortTitle } : {}),
      ...(stage.timeLabel?.trim() ? { timeLabel: stage.timeLabel } : {}),
      content,
      ...(stage.vitals?.values?.length
        ? {
            measurements: {
              timestamp: stage.vitals.timestamp,
              values: stage.vitals.values.map((value) => ({
                id: value.id,
                label: value.label,
                value: value.value,
                ...(value.unit?.trim() ? { unit: value.unit } : {}),
                ...(value.note?.trim() ? { note: value.note } : {}),
              })),
            },
          }
        : {}),
      ...(stage.afterParagraphs?.filter((text) => text.trim()).length
        ? { afterMeasurements: blocks(stage.afterParagraphs) }
        : {}),
      questions,
    };
    return part;
  });

  return {
    id: caseId,
    title: plan.title,
    patient: plan.patient,
    specialty: plan.specialty,
    ...(plan.background?.filter((text) => text.trim()).length
      ? { background: blocks(plan.background) }
      : {}),
    parts: parts as [CasePart, ...CasePart[]],
  };
}
