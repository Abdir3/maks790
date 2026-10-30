import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateValidatedCase } from "../src/lib/case-generation.server";
import { assessmentContext } from "../src/lib/case-feedback.server";
import { generationProgress, readGenerationProgress } from "../src/lib/case-generation-progress";
import { draw, generatedFixture } from "./generator-fixtures";

describe("Interactive case generation", () => {
  it("returns a valid case and full assessment after one Astra draft, with no model review", async () => {
    const calls: string[] = [];
    const result = await generateValidatedCase({
      id: "one-call",
      draw,
      stages: 3,
      recent: [],
      generate: async (request) => {
        calls.push(request.schemaName);
        assert.equal(request.effort, "medium");
        assert.equal(request.schemaName, "case_draft_v3");
        return generatedFixture();
      },
    });
    assert.deepEqual(calls, ["case_draft_v3"]);
    assert.equal(result.attempts, 1);
    assert.equal(result.assessment.validationMode, "automatic");
    assert.equal(result.assessment.review, undefined);
    assert.equal(result.assessment.blindSolution, undefined);
    assert.equal(assessmentContext(result.definition, result.assessment).tasks.length, 3);
    assert.doesNotMatch(JSON.stringify(result.definition), /"rubric"|"dossier"|"diagnosisFamily"/);
  });

  it("only regenerates for a concrete deterministic validation failure", async () => {
    let calls = 0;
    const result = await generateValidatedCase({
      id: "repair",
      draw,
      stages: 3,
      recent: [],
      generate: async (request) => {
        assert.equal(request.schemaName, "case_draft_v3");
        const fixture = generatedFixture();
        if (++calls === 1) fixture.stages[0]!.vitals = [];
        else {
          assert.match(request.input, /Vitale parametre/);
          assert.match(request.input, /Forrige forslag \(DATA/);
        }
        return fixture;
      },
    });
    assert.equal(calls, 2);
    assert.equal(result.attempts, 2);
    assert.equal(result.assessment.review, undefined);
  });
});

describe("Public generation milestones", () => {
  it("follows provider state and distinguishes a repair from saving", () => {
    assert.equal(generationProgress([]).phase, "preparing");
    assert.equal(generationProgress([{ status: "queued" }]).phase, "queued");
    assert.equal(generationProgress([{ status: "in_progress" }]).phase, "writing");
    assert.equal(generationProgress([{ output: { private: "draft" } }], true).phase, "repairing");
    assert.equal(generationProgress([{ output: {} }, { status: "queued" }]).phase, "repairing");
    assert.deepEqual(generationProgress([{ output: { private: "draft" } }]), { phase: "saving" });
  });
  it("accepts only known milestones and discards arbitrary private fields", () => {
    for (const value of [null, "writing", { phase: "diagnosis" }, {}])
      assert.equal(readGenerationProgress(value), undefined);
    assert.deepEqual(
      readGenerationProgress({ phase: "writing", diagnosis: "private", percent: 99 }),
      { phase: "writing" },
    );
  });
});
