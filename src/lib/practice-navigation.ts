import { allQuestions, answeredCount, parseDraft, type CaseDefinition } from "./case-model";

export type PracticeSearch = { mode?: "quick" | "long"; library?: true };

// Only app-owned destinations may survive an authentication round trip.
export function validatePracticeSearch(search: Record<string, unknown>): PracticeSearch {
  if (search["mode"] === "quick" || search["mode"] === "long") return { mode: search["mode"] };
  return search["library"] === true ? { library: true } : {};
}

export type DraftSummary = {
  state: "new" | "started" | "completed" | "unavailable";
  answered: number;
  total: number;
};

export function summarizeDraft(definition: CaseDefinition, raw: string | null): DraftSummary {
  const total = allQuestions(definition).length;
  if (!raw) return { state: "new", answered: 0, total };
  try {
    const draft = parseDraft(raw, definition);
    return {
      state: draft.completedAt ? "completed" : "started",
      answered: answeredCount(definition, draft.answers),
      total,
    };
  } catch {
    return { state: "unavailable", answered: 0, total };
  }
}

export function draftSummaryLabel(summary: DraftSummary) {
  if (summary.state === "unavailable") return "Kladdstatus er utilgjengelig på denne enheten";
  if (summary.state === "new") return "Ikke påbegynt på denne enheten";
  return `${summary.state === "completed" ? "Fullført" : "Fortsett"} · ${summary.answered} av ${summary.total} besvart på denne enheten`;
}
