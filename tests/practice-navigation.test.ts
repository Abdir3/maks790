import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blankDraft } from "../src/lib/case-model";
import {
  draftSummaryLabel,
  summarizeDraft,
  validatePracticeSearch,
} from "../src/lib/practice-navigation";
import { groupedCase } from "./case-fixtures";

describe("Practice entry and local library progress", () => {
  it("retains only the two supported practice modes through login", () => {
    for (const mode of ["quick", "long"])
      assert.deepEqual(validatePracticeSearch({ mode, redirect: "https://example.com" }), { mode });
    for (const mode of [
      undefined,
      "https://example.com",
      "//example.com",
      "library",
      ["quick"],
      {},
    ])
      assert.deepEqual(validatePracticeSearch({ mode }), {});
    assert.deepEqual(validatePracticeSearch({ library: true, redirect: "//example.com" }), {
      library: true,
    });
    assert.deepEqual(validatePracticeSearch({ library: "anything" }), {});
    assert.deepEqual(validatePracticeSearch({ library: true, mode: "quick" }), { mode: "quick" });
  });
  it("counts only valid answered questions, without exposing saved text", () => {
    const draft = blankDraft(groupedCase);
    draft.answers = { "question-1": "Answer", "question-2a": " \n", unknown: "Stray text" };
    const summary = summarizeDraft(groupedCase, JSON.stringify(draft));
    assert.deepEqual(summary, { state: "started", answered: 1, total: 3 });
    assert.match(draftSummaryLabel(summary), /Fortsett · 1 av 3/);
    assert.doesNotMatch(JSON.stringify(summary), /Answer|Stray/);
  });
  it("retains only a case UUID for a saved-case link through login", () => {
    const id = "a81db549-7bbf-4a4b-821f-7195b111e33b";
    assert.deepEqual(
      validatePracticeSearch({
        case: id.toUpperCase(),
        mode: "quick",
        redirect: "https://example.com",
      }),
      { case: id },
    );
    for (const invalid of ["//example.com", "gen-" + id, [id], {}, "", id + "/anything"])
      assert.deepEqual(validatePracticeSearch({ case: invalid }), {});
  });
  it("distinguishes missing, unreadable and completed drafts without modifying them", () => {
    assert.equal(summarizeDraft(groupedCase, null).state, "new");
    for (const raw of ["{", '{"version":99}', "null"])
      assert.equal(summarizeDraft(groupedCase, raw).state, "unavailable");
    const draft = { ...blankDraft(groupedCase), completedAt: "2026-10-28T12:00:00Z" };
    assert.equal(summarizeDraft(groupedCase, JSON.stringify(draft)).state, "completed");
    assert.equal(
      summarizeDraft(groupedCase, JSON.stringify({ ...draft, completedAt: "bad" })).state,
      "started",
    );
  });
});
