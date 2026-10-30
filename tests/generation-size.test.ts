import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { draftContract, generationDraftContract } from "../src/lib/case-contract";
import { generateValidatedCase } from "../src/lib/case-generation.server";
import { generationPrompt } from "../src/lib/case-prompt.server";
import { draw, generatedFixture } from "./generator-fixtures";

function quickFixture() {
  const fixture = generatedFixture(1);
  const next = structuredClone(fixture.stages[0]!.questions[0]!);
  next.prompt =
    "Hvordan begrunner du den mest sannsynlige forklaringen og det videre behandlingsnivået?";
  next.skill = "differential";
  fixture.stages[0]!.questions.push(next);
  return fixture;
}

describe("Bounded generation content", () => {
  it("constrains the provider to exactly the requested number of stages", () => {
    for (let count = 1; count <= 6; count++) {
      const contract = generationDraftContract(count);
      const stages = contract.json.properties.stages as {
        minItems: number;
        maxItems: number;
      };
      assert.equal(stages.minItems, count);
      assert.equal(stages.maxItems, count);
      const fixture = count === 1 ? quickFixture() : generatedFixture(count);
      assert.equal(contract.validator.safeParse(fixture).success, true);
      fixture.stages.push(structuredClone(fixture.stages[0]!));
      assert.equal(contract.validator.safeParse(fixture).success, false);
    }
    for (const invalid of [0, 7, 1.5, NaN]) assert.throws(() => generationDraftContract(invalid));
  });

  it("limits expansive private prose while preserving previously saved assessments", () => {
    const fixture = quickFixture();
    fixture.dossier = "Fullstendig klinisk begrunnelse. ".repeat(100);
    fixture.stages[0]!.questions[0]!.rubric.expected[0] = "Klinisk vurdering. ".repeat(80);
    assert.equal(draftContract.validator.safeParse(fixture).success, true);
    assert.equal(generationDraftContract(1).validator.safeParse(fixture).success, false);
    // Calling the generation factory must never narrow the archival contract.
    generationDraftContract(6);
    assert.equal(draftContract.validator.safeParse(fixture).success, true);
  });

  it("keeps required clinical data capacities and a conditional alternative per question", () => {
    const savedSchema = draftContract.json.properties;
    const conciseSchema = generationDraftContract(1).json.properties;
    const oldStages = savedSchema.stages as { items: { properties: Record<string, unknown> } };
    const newStages = conciseSchema.stages as { items: { properties: Record<string, unknown> } };
    for (const field of ["medications", "laboratory", "bloodGas", "reports", "vitals"])
      assert.deepEqual(newStages.items.properties[field], oldStages.items.properties[field]);
    const fixture = quickFixture();
    fixture.stages[0]!.questions[0]!.rubric.alternatives = [];
    assert.equal(generationDraftContract(1).validator.safeParse(fixture).success, false);
  });

  it("uses the same concise provider contract and runtime validation, with full assessment", async () => {
    let calls = 0;
    const result = await generateValidatedCase({
      id: "bounded-quick",
      stages: 1,
      draw,
      recent: [],
      generate: async (request) => {
        calls++;
        assert.deepEqual(request.schema, generationDraftContract(1).json);
        assert.equal(request.effort, "medium");
        return quickFixture();
      },
    });
    assert.equal(calls, 1);
    assert.equal(result.assessment.generated.stages[0]!.questions.length, 2);
    assert.equal(
      result.assessment.generated.stages[0]!.questions[0]!.rubric.alternatives.length,
      1,
    );
    assert.doesNotMatch(JSON.stringify(result.definition), /"rubric"|"dossier"/);
  });

  it("asks for compact writing without sacrificing decisive data or alternatives", () => {
    const prompt = generationPrompt(draw, 1, []);
    assert.match(prompt, /Behold alle nødvendige kliniske data/);
    assert.match(prompt, /maksimum, ikke mål/);
    assert.match(prompt, /Nøyaktig én del/);
    assert.match(prompt, /alternatives angir et forsvarlig alternativ og vilkår/);
  });
});
