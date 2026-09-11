export type ContentBlock =
  | { type: "paragraph"; text: string; title?: string }
  | { type: "quote"; text: string; title?: string }
  | { type: "list"; items: string[]; title?: string };

export type AnswerQuestion = { id: string; label: string; prompt: string };
export type CaseQuestion =
  | AnswerQuestion
  | {
      id: string;
      label: string;
      prompt?: string;
      subquestions: AnswerQuestion[];
    };
export type Measurement = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  note?: string;
};
export type MeasurementSet = { timestamp: string; values: Measurement[] };
export type CasePart = {
  id: string;
  title: string;
  shortTitle?: string;
  timeLabel?: string;
  content: ContentBlock[];
  measurements?: MeasurementSet;
  afterMeasurements?: ContentBlock[];
  questions: CaseQuestion[];
};
export type CaseDefinition = {
  id: string;
  title: string;
  patient?: string;
  specialty?: string;
  background?: ContentBlock[];
  parts: [CasePart, ...CasePart[]];
};
export type LocatedQuestion = AnswerQuestion & {
  partId: string;
  groupLabel?: string;
  groupPrompt?: string;
};
export type WorkspaceTab = "situation" | "answer";
export type CaseDraft = {
  version: 1;
  answers: Record<string, string>;
  partId: string;
  tab: WorkspaceTab;
  completedAt: string | null;
};

export function questionsForPart(part: CasePart): LocatedQuestion[] {
  return part.questions.flatMap((question) =>
    "subquestions" in question
      ? question.subquestions.map((child) => ({
          ...child,
          partId: part.id,
          groupLabel: question.label,
          groupPrompt: question.prompt,
        }))
      : [{ ...question, partId: part.id }],
  );
}

export function allQuestions(definition: CaseDefinition) {
  return definition.parts.flatMap(questionsForPart);
}

export function answeredCount(definition: CaseDefinition, answers: Record<string, string>) {
  return allQuestions(definition).filter((question) => Boolean(answers[question.id]?.trim()))
    .length;
}

export function nextQuestion(definition: CaseDefinition, questionId: string) {
  const questions = allQuestions(definition);
  const index = questions.findIndex((question) => question.id === questionId);
  return index < 0 ? questions[0] : questions[index + 1];
}

export function partNavigation(definition: CaseDefinition) {
  return definition.parts.length < 2 ? "none" : definition.parts.length < 4 ? "buttons" : "select";
}

export function previousMeasurements(definition: CaseDefinition, partId: string) {
  const index = definition.parts.findIndex((part) => part.id === partId);
  return definition.parts
    .slice(0, index)
    .reverse()
    .find((part) => part.measurements?.values.length)?.measurements;
}

export function blankDraft(definition: CaseDefinition): CaseDraft {
  return {
    version: 1,
    answers: {},
    partId: definition.parts[0].id,
    tab: "situation",
    completedAt: null,
  };
}

export function draftKey(caseId: string) {
  return `maks790:case:${caseId}:v1`;
}

// Saved text is untrusted input; only restore answer IDs belonging to this case.
export function parseDraft(raw: string | null, definition: CaseDefinition): CaseDraft {
  if (!raw) return blankDraft(definition);
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1) {
    throw new Error("Ukjent kladdformat");
  }
  const saved = value as Partial<CaseDraft>;
  const part = definition.parts.find((item) => item.id === saved.partId) ?? definition.parts[0];
  const answers: Record<string, string> = {};
  for (const question of allQuestions(definition)) {
    const text = saved.answers?.[question.id];
    if (typeof text === "string") answers[question.id] = text;
  }
  return {
    version: 1,
    answers,
    partId: part.id,
    tab: saved.tab === "answer" && questionsForPart(part).length > 0 ? "answer" : "situation",
    completedAt:
      typeof saved.completedAt === "string" && Number.isFinite(Date.parse(saved.completedAt))
        ? saved.completedAt
        : null,
  };
}

export function validateCase(definition: CaseDefinition) {
  if (!definition.id || !definition.title || definition.parts.length === 0)
    throw new Error("Casen må ha ID, tittel og minst én del.");
  const ids = new Set<string>();
  for (const item of [
    ...definition.parts,
    ...definition.parts.flatMap((part) => part.questions),
    ...definition.parts.flatMap((part) =>
      part.questions.flatMap((question) =>
        "subquestions" in question ? question.subquestions : [],
      ),
    ),
  ]) {
    if (!item.id || ids.has(item.id)) throw new Error(`Ugyldig eller duplisert ID: ${item.id}`);
    ids.add(item.id);
    if ("subquestions" in item && item.subquestions.length === 0)
      throw new Error("En oppgavegruppe må ha delspørsmål.");
  }
  if (allQuestions(definition).length === 0) throw new Error("Casen må ha minst én besvarelse.");
  return definition;
}
