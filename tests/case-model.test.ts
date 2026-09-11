import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  allQuestions,
  answeredCount,
  blankDraft,
  draftKey,
  nextQuestion,
  parseDraft,
  partNavigation,
  previousMeasurements,
  validateCase,
} from "../src/lib/case-model";
import { randiCase, dyspneaCase } from "../src/data/cases";
import { minimalCase, groupedCase, fivePartCase } from "./case-fixtures";

describe("Dynamic case structure", () => {
  it("supports all five agreed shapes without fixed step or question counts", () => {
    for (const definition of [randiCase, dyspneaCase, minimalCase, groupedCase, fivePartCase])
      assert.equal(validateCase(definition), definition);
    assert.equal(partNavigation(minimalCase), "none");
    assert.equal(partNavigation(groupedCase), "none");
    assert.equal(partNavigation(randiCase), "buttons");
    assert.equal(partNavigation(fivePartCase), "select");
    assert.equal(allQuestions(dyspneaCase).length, 1);
    assert.equal(allQuestions(groupedCase).length, 3);
    assert.equal(allQuestions(randiCase).length, 4);
    assert.equal(allQuestions(fivePartCase).length, 4);
  });
  it("counts leaf answers only and ignores whitespace and unknown questions", () => {
    assert.equal(
      answeredCount(groupedCase, {
        "question-1": " \n ",
        "group-2": "Not an answer",
        "question-2a": "Answer",
        unknown: "Stray answer",
      }),
      1,
    );
    assert.deepEqual(
      allQuestions(randiCase).map((q) => q.id),
      ["randi-1", "randi-2", "randi-3a", "randi-3b"],
    );
  });
  it("navigates across information-only parts and subquestions in source order", () => {
    assert.equal(nextQuestion(fivePartCase, "question-1")?.id, "question-3");
    assert.equal(nextQuestion(randiCase, "randi-3a")?.id, "randi-3b");
    assert.equal(nextQuestion(randiCase, "randi-3b"), undefined);
  });
  it("preserves the shared group instruction without adding a parent answer", () => {
    const question = allQuestions(groupedCase).find((item) => item.id === "question-2a");
    assert.equal(question?.groupLabel, "Oppgave 2");
    assert.match(question?.groupPrompt ?? "", /begge delspørsmålene/);
  });
  it("only compares actual earlier measurements and adds none to the legevakt phase", () => {
    assert.equal(randiCase.parts[1]?.measurements, undefined);
    assert.equal(previousMeasurements(randiCase, "ambulanse"), undefined);
    assert.equal(previousMeasurements(randiCase, "kad")?.timestamp, "Fredag 15.30");
    assert.equal(
      randiCase.parts[2]?.measurements?.values.find((value) => value.id === "gcs")?.value,
      "13",
    );
    assert.match(JSON.stringify(randiCase.parts[2]?.afterMeasurements), /24 mg\/L/);
  });
  it("rejects duplicate IDs that would mix answers or parts", () => {
    assert.throws(
      () => validateCase({ ...minimalCase, parts: [minimalCase.parts[0], minimalCase.parts[0]] }),
      /duplisert/,
    );
  });
});

describe("Local drafts", () => {
  it("restores separate subquestion answers, navigation and completion", () => {
    const draft = {
      ...blankDraft(randiCase),
      partId: "kad",
      tab: "answer",
      answers: { "randi-3a": "First", "randi-3b": "Second" },
      completedAt: "2026-09-11T10:00:00.000Z",
    };
    assert.deepEqual(parseDraft(JSON.stringify(draft), randiCase), draft);
  });
  it("isolates cases and removes answers no longer in the definition", () => {
    assert.notEqual(draftKey(randiCase.id), draftKey(dyspneaCase.id));
    const raw = JSON.stringify({
      ...blankDraft(randiCase),
      answers: { "randi-1": "Keep", "randi-2": 100, unknown: "Remove" },
    });
    assert.deepEqual(parseDraft(raw, randiCase).answers, { "randi-1": "Keep" });
  });
  it("recovers a removed part and prevents an empty answer tab for information-only parts", () => {
    assert.equal(
      parseDraft(JSON.stringify({ ...blankDraft(fivePartCase), partId: "deleted" }), fivePartCase)
        .partId,
      "part-1",
    );
    assert.equal(
      parseDraft(
        JSON.stringify({ ...blankDraft(fivePartCase), partId: "part-2", tab: "answer" }),
        fivePartCase,
      ).tab,
      "situation",
    );
  });
  it("rejects corrupt storage so the UI can warn without overwriting the saved draft", () => {
    assert.throws(() => parseDraft("broken json", randiCase));
    assert.throws(() => parseDraft('{"version":99}', randiCase));
    assert.deepEqual(parseDraft(null, randiCase), blankDraft(randiCase));
  });
});
