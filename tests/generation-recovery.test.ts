import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generationTargetSeconds,
  shouldOpenGeneratedCase,
  type GenerationJob,
} from "../src/lib/case-generation-job";

const completed: GenerationJob = {
  id: "job-on-this-account",
  status: "completed",
  format: "quick",
  createdAt: "2026-10-30T12:00:00Z",
  progress: { phase: "completed" },
  definition: {
    id: "generated-example",
    title: "Case",
    parts: [{ id: "part-1", title: "Situasjon", content: [], questions: [] }],
  },
};
const active = {
  requestedJobId: completed.id,
  job: completed,
  dialogOpen: true,
  pageVisible: true,
};
describe("Durable generation recovery navigation", () => {
  it("opens a completed case only when the user is still waiting in its visible dialog", () => {
    assert.equal(shouldOpenGeneratedCase(active), true);
    assert.equal(shouldOpenGeneratedCase({ ...active, dialogOpen: false }), false);
    assert.equal(shouldOpenGeneratedCase({ ...active, pageVisible: false }), false);
  });
  it("does not navigate when returning to a recovered job without asking to open it", () => {
    assert.equal(shouldOpenGeneratedCase({ ...active, requestedJobId: null }), false);
    assert.equal(shouldOpenGeneratedCase({ ...active, requestedJobId: "another-job" }), false);
  });
  it("never treats elapsed time, failure or missing output as a completed case", () => {
    assert.equal(
      shouldOpenGeneratedCase({ ...active, job: { ...completed, status: "pending" } }),
      false,
    );
    assert.equal(
      shouldOpenGeneratedCase({ ...active, job: { ...completed, status: "failed" } }),
      false,
    );
    const { definition: _definition, ...withoutDefinition } = completed;
    assert.equal(shouldOpenGeneratedCase({ ...active, job: withoutDefinition }), false);
    assert.equal(shouldOpenGeneratedCase({ ...active, job: null }), false);
  });
  it("uses the requested short and long generation time targets", () => {
    assert.equal(generationTargetSeconds("quick"), 150);
    assert.equal(generationTargetSeconds("long"), 180);
  });
});
