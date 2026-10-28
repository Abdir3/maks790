import { useEffect, useState } from "react";
import type { CaseFeedback, ModelAnswer, SourceLink } from "../lib/case-contract";
import { allQuestions, type CaseDefinition } from "../lib/case-model";

export type AssessAnswers = (
  answers: Record<string, string>,
  solutionViewed?: boolean,
) => Promise<{ feedback: CaseFeedback; sources: SourceLink[] }>;
export type GetModelAnswer = () => Promise<{ modelAnswer: ModelAnswer; sources: SourceLink[] }>;
type FeedbackResult = Awaited<ReturnType<AssessAnswers>>;
type SolutionResult = Awaited<ReturnType<GetModelAnswer>>;
export type LearningState = {
  assessment: { fingerprint: string; result: FeedbackResult; solutionViewed: boolean } | null;
  solution: SolutionResult | null;
  solutionOpen: boolean;
  busy: "feedback" | "solution" | null;
  error: string;
};

const emptyState = (): LearningState => ({
  assessment: null,
  solution: null,
  solutionOpen: false,
  busy: null,
  error: "",
});

// Viewing a solution changes study context, not the version of an existing answer.
export function answerFingerprint(definition: CaseDefinition, answers: Record<string, string>) {
  return JSON.stringify([
    definition.id,
    allQuestions(definition).map((q) => [q.id, answers[q.id] ?? ""]),
  ]);
}

/** Lives with the workspace, independently of the visible editing/review panel. */
export function createCaseLearningController() {
  let state = emptyState();
  let sequence = 0;
  let active: number | null = null;
  const listeners = new Set<() => void>();
  const publish = (next: LearningState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  async function request(
    kind: "feedback" | "solution",
    generate: () => Promise<FeedbackResult | SolutionResult>,
    fingerprint = "",
    solutionViewed = false,
  ) {
    if (active !== null) return;
    const id = ++sequence;
    active = id;
    publish({ ...state, busy: kind, error: "" });
    try {
      const result = await generate();
      if (active !== id) return;
      active = null;
      publish(
        kind === "feedback"
          ? {
              ...state,
              busy: null,
              assessment: { fingerprint, result: result as FeedbackResult, solutionViewed },
            }
          : { ...state, busy: null, solution: result as SolutionResult, solutionOpen: true },
      );
    } catch (error) {
      if (active !== id) return;
      active = null;
      publish({
        ...state,
        busy: null,
        error: error instanceof Error ? error.message : "Kunne ikke hente læringsstøtten.",
      });
    }
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    assess(
      assess: AssessAnswers,
      answers: Record<string, string>,
      fingerprint: string,
      solutionViewed: boolean,
    ) {
      const snapshot = { ...answers };
      return request(
        "feedback",
        () => assess(snapshot, solutionViewed),
        fingerprint,
        solutionViewed,
      );
    },
    showSolution(getModelAnswer: GetModelAnswer) {
      if (state.solution) {
        publish({ ...state, solutionOpen: true });
        return Promise.resolve();
      }
      return request("solution", getModelAnswer);
    },
    hideSolution() {
      publish({ ...state, solutionOpen: false });
    },
    reset() {
      active = null;
      ++sequence;
      publish(emptyState());
    },
  };
}

export function useCaseLearning({
  definition,
  answers,
  assess,
  getModelAnswer,
  solutionViewed,
  disabled,
}: {
  definition: CaseDefinition;
  answers: Record<string, string>;
  assess: AssessAnswers | undefined;
  getModelAnswer: GetModelAnswer | undefined;
  solutionViewed: boolean;
  disabled: boolean;
}) {
  const [controller] = useState(createCaseLearningController);
  const [state, setState] = useState(controller.getSnapshot);
  useEffect(() => {
    const refresh = () => setState(controller.getSnapshot());
    const unsubscribe = controller.subscribe(refresh);
    refresh();
    return unsubscribe;
  }, [controller]);
  const fingerprint = answerFingerprint(definition, answers);
  return {
    ...state,
    feedbackIsCurrent: state.assessment?.fingerprint === fingerprint,
    requestFeedback: () => {
      if (!disabled && assess) void controller.assess(assess, answers, fingerprint, solutionViewed);
    },
    toggleSolution: () => {
      if (state.solutionOpen) controller.hideSolution();
      else if (!disabled && getModelAnswer) void controller.showSolution(getModelAnswer);
    },
    reset: controller.reset,
  };
}
export type CaseLearning = ReturnType<typeof useCaseLearning>;
