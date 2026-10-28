import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  answerFingerprint,
  createCaseLearningController,
  type AssessAnswers,
  type GetModelAnswer,
} from "../src/hooks/use-case-learning";
import { minimalCase } from "./case-fixtures";

type FeedbackResult = Awaited<ReturnType<AssessAnswers>>;
const feedback = (evidence: string): FeedbackResult => ({
  feedback: {
    summary: "Begrunn vurderingen med de konkrete funnene.",
    questions: [
      {
        questionId: "question-1",
        status: "partial",
        evidence,
        strengths: [],
        improvements: ["Knytt funn til prioriteringen."],
        alternatives: [],
        safety: [],
        nextStep: "Utdyp ett resonnement.",
        sourceIds: [],
      },
    ],
  },
  sources: [],
});
const solution: Awaited<ReturnType<GetModelAnswer>> = {
  modelAnswer: {
    summary: "Et begrunnet eksempel.",
    questions: [
      {
        questionId: "question-1",
        explanation: "Sammenhold funnene og begrunn videre vurdering.",
        keyFindings: ["Ny funksjonsendring."],
        alternatives: ["Andre forklaringer vurderes i sammenheng."],
        sourceIds: [],
      },
    ],
  },
  sources: [],
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("Case learning session", () => {
  it("retains a pending assessment when the review view is left and reopened", async () => {
    const controller = createCaseLearningController();
    const pending = deferred<FeedbackResult>();
    let calls = 0;
    const unsubscribe = controller.subscribe(() => undefined);
    const answers = { "question-1": "Første begrunnelse." };
    const fingerprint = answerFingerprint(minimalCase, answers);
    const request = controller.assess(
      async () => {
        calls++;
        return pending.promise;
      },
      answers,
      fingerprint,
      false,
    );
    assert.equal(controller.getSnapshot().busy, "feedback");
    unsubscribe(); // Editing/review navigation must not own the request lifetime.
    pending.resolve(feedback(answers["question-1"]));
    await request;
    const reopened = controller.getSnapshot();
    assert.equal(reopened.busy, null);
    assert.equal(reopened.assessment?.fingerprint, fingerprint);
    assert.equal(
      reopened.assessment?.result.feedback.questions[0]?.evidence,
      "Første begrunnelse.",
    );
    assert.equal(calls, 1);
  });

  it("keeps the old result tied to its answer snapshot while edits are made", async () => {
    const controller = createCaseLearningController();
    const pending = deferred<FeedbackResult>();
    const answers = { "question-1": "Første begrunnelse." };
    const oldFingerprint = answerFingerprint(minimalCase, answers);
    let submitted: Record<string, string> = {};
    const request = controller.assess(
      async (snapshot) => {
        submitted = snapshot;
        return pending.promise;
      },
      answers,
      oldFingerprint,
      false,
    );
    answers["question-1"] = "Oppdatert begrunnelse.";
    pending.resolve(feedback("Første begrunnelse."));
    await request;
    assert.equal(submitted["question-1"], "Første begrunnelse.");
    assert.equal(controller.getSnapshot().assessment?.fingerprint, oldFingerprint);
    assert.notEqual(
      controller.getSnapshot().assessment?.fingerprint,
      answerFingerprint(minimalCase, answers),
    );
    await controller.assess(
      async () => feedback(answers["question-1"]),
      answers,
      answerFingerprint(minimalCase, answers),
      false,
    );
    assert.equal(
      controller.getSnapshot().assessment?.result.feedback.questions[0]?.evidence,
      "Oppdatert begrunnelse.",
    );
  });

  it("reopens the same cached solution without a second request or invalidating unchanged feedback", async () => {
    const controller = createCaseLearningController();
    const answers = { "question-1": "Min begrunnelse." };
    const fingerprint = answerFingerprint(minimalCase, answers);
    await controller.assess(
      async () => feedback(answers["question-1"]),
      answers,
      fingerprint,
      false,
    );
    let calls = 0;
    const generate = async () => {
      calls++;
      return solution;
    };
    await controller.showSolution(generate);
    assert.equal(controller.getSnapshot().solutionOpen, true);
    controller.hideSolution();
    assert.equal(controller.getSnapshot().solutionOpen, false);
    await controller.showSolution(generate);
    assert.equal(controller.getSnapshot().solutionOpen, true);
    assert.equal(controller.getSnapshot().solution, solution);
    assert.equal(controller.getSnapshot().assessment?.fingerprint, fingerprint);
    assert.equal(controller.getSnapshot().assessment?.solutionViewed, false);
    assert.equal(calls, 1);
  });

  it("ignores an old completion after reset, including when a new request is active", async () => {
    const controller = createCaseLearningController();
    const old = deferred<FeedbackResult>();
    const fresh = deferred<FeedbackResult>();
    const oldRequest = controller.assess(
      () => old.promise,
      { "question-1": "Gammelt svar." },
      "old",
      false,
    );
    controller.reset();
    const newRequest = controller.assess(
      () => fresh.promise,
      { "question-1": "Nytt svar." },
      "new",
      false,
    );
    old.resolve(feedback("Gammelt svar."));
    await oldRequest;
    assert.equal(controller.getSnapshot().assessment, null);
    assert.equal(controller.getSnapshot().busy, "feedback");
    fresh.resolve(feedback("Nytt svar."));
    await newRequest;
    assert.equal(controller.getSnapshot().assessment?.fingerprint, "new");
    await controller.showSolution(async () => solution);
    controller.reset();
    assert.equal(controller.getSnapshot().assessment, null);
    assert.equal(controller.getSnapshot().solution, null);
    assert.equal(controller.getSnapshot().solutionOpen, false);
  });

  it("retains useful feedback after an update fails and prevents overlapping requests", async () => {
    const controller = createCaseLearningController();
    await controller.assess(async () => feedback("Begrunnelse."), {}, "first", false);
    const pending = deferred<FeedbackResult>();
    const request = controller.assess(() => pending.promise, {}, "second", false);
    let extraCalls = 0;
    await controller.assess(
      async () => {
        extraCalls++;
        return feedback("Unødvendig.");
      },
      {},
      "third",
      false,
    );
    await controller.showSolution(async () => {
      extraCalls++;
      return solution;
    });
    assert.equal(extraCalls, 0);
    pending.reject(new Error("Prøv igjen."));
    await request;
    assert.equal(controller.getSnapshot().assessment?.fingerprint, "first");
    assert.equal(controller.getSnapshot().error, "Prøv igjen.");
    assert.equal(controller.getSnapshot().busy, null);
  });
});
