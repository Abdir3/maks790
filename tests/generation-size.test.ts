import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { draftContract, generationDraftContract } from "../src/lib/case-contract";
import { generateValidatedCase } from "../src/lib/case-generation.server";
import { generationPrompt } from "../src/lib/case-prompt.server";
import { buildDefinition, normaliseClinicalData } from "../src/lib/generated-case";
import { validateGenerated } from "../src/lib/case-quality";
import { draw, generatedFixture } from "./generator-fixtures";
import { shortCaseDraw, shortCaseFixture } from "./short-case-fixtures";

function quickFixture() {
  const fixture = generatedFixture(1);
  fixture.background[1] =
    "Går uten hjelpemidler. Ingen kjent kognitiv svikt. Ektefellen er usikker på legemiddelinntaket siste døgn.";
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

  it("keeps conditional alternatives and rejects a long-case-sized short narrative", () => {
    const fixture = quickFixture();
    fixture.stages[0]!.questions[0]!.rubric.alternatives = [];
    assert.equal(generationDraftContract(1).validator.safeParse(fixture).success, false);
    const longNarrative = quickFixture();
    longNarrative.stages[0]!.paragraphs = ["Klinisk tekst. ".repeat(30)];
    assert.equal(generationDraftContract(1).validator.safeParse(longNarrative).success, false);
    assert.equal(draftContract.validator.safeParse(longNarrative).success, true);
  });

  it("delivers a concise case with the data needed for blood gas and medication reasoning", () => {
    const fixture = shortCaseFixture();
    const parsed = generationDraftContract(1).validator.parse(fixture);
    const normalised = normaliseClinicalData(parsed);
    assert.deepEqual(validateGenerated(normalised, shortCaseDraw, 1, shortCaseDraw.sourceIds), []);
    const narrative = [
      fixture.role,
      ...fixture.background,
      ...fixture.stages[0]!.paragraphs,
      ...fixture.stages[0]!.clinicalFindings,
    ].join(" ");
    assert.ok(narrative.split(/\s+/).length >= 100 && narrative.split(/\s+/).length <= 180);
    const definition = buildDefinition("short-clinical", normalised, shortCaseDraw);
    const stage = definition.parts[0]!;
    assert.equal(stage.questions.length, 2);
    const gas = stage.investigations!.find((group) => group.kind === "blood-gas")!;
    for (const field of ["ph", "pco2", "po2", "hco3", "be"])
      assert.ok(gas.values.some((value) => value.id === field));
    assert.equal(gas.oxygen, "Romluft");
    assert.equal(gas.sampleType, "Arteriell");
    const ecg = stage.investigations!.find((group) => group.kind === "ecg")!;
    assert.ok(ecg.findings?.includes("Sinusrytme"));
    assert.ok(ecg.conclusion?.includes("Sinustakykardi"));
    const labs = stage
      .investigations!.filter((group) => group.kind === "laboratory")
      .flatMap((group) => group.values);
    for (const field of [
      "glucose",
      "ketones",
      "sodium",
      "potassium",
      "chloride",
      "albumin",
      "creatinine",
      "lactate",
    ])
      assert.ok(labs.some((value) => value.id === field && value.unit && value.referenceRange));
    assert.match(JSON.stringify(stage.content), /22 enheter/);
    assert.match(JSON.stringify(stage.content), /subkutant/);
    assert.match(JSON.stringify(stage.content), /1 døgn 12 t før/);
    assert.ok(parsed.stages[0]!.medications.every((medicine) => medicine.sourceIds.length));
    assert.ok(parsed.stages[0]!.questions.every((question) => question.rubric.sourceIds.length));
    assert.doesNotMatch(JSON.stringify(definition), /"rubric"|"dossier"|"diagnosisFamily"/);
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
    assert.match(prompt, /Nøyaktig én avgrenset hendelse i én del/);
    assert.match(prompt, /alternatives angir et forsvarlig alternativ og vilkår/);
    assert.match(prompt, /100–180 ord/);
    assert.match(prompt, /normalt to fokuserte spørsmål/);
    assert.match(prompt, /ikke fjern data som svarene krever/);
  });
});

type JsonShape = {
  type: string;
  enum?: string[];
  maxLength?: number;
  maximum?: number;
  minimum?: number;
  maxItems?: number;
  items?: JsonShape;
  properties?: Record<string, JsonShape>;
};
function maximumShape(schema: JsonShape): unknown {
  if (schema.enum) return [...schema.enum].sort((a, b) => b.length - a.length)[0];
  if (schema.type === "string")
    return "æøå".repeat(Math.ceil(schema.maxLength! / 3)).slice(0, schema.maxLength);
  if (schema.type === "number") {
    const candidates = [schema.minimum!, schema.maximum!];
    return candidates.sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length)[0];
  }
  if (schema.type === "array")
    return Array.from({ length: schema.maxItems! }, () => maximumShape(schema.items!));
  if (schema.type === "object")
    return Object.fromEntries(
      Object.entries(schema.properties!).map(([key, child]) => [key, maximumShape(child)]),
    );
  throw new Error(`Unexpected schema type ${schema.type}`);
}
function characterSum(value: unknown): number {
  if (typeof value === "string") return value.length;
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + characterSum(item), 0);
  if (value && typeof value === "object")
    return Object.values(value).reduce<number>((sum, item) => sum + characterSum(item), 0);
  return 0;
}
describe("Whole short-response size", () => {
  it("bounds all prose, clinical fields and array counts together, including private data", () => {
    const short = maximumShape(generationDraftContract(1).json as JsonShape);
    assert.equal(generationDraftContract(1).validator.safeParse(short).success, true);
    // A character budget is not a token guarantee: escaping, whitespace and
    // tokenization differ. This catches expansion across all nested fields.
    assert.ok(characterSum(short) <= 24000, `Maximum text payload: ${characterSum(short)}`);
    assert.ok(
      JSON.stringify(short).length <= 32000,
      `Maximum JSON characters: ${JSON.stringify(short).length}`,
    );
    const before = maximumShape(generationDraftContract(2).json as JsonShape) as {
      stages: unknown[];
    };
    before.stages = [before.stages[0]];
    assert.ok(JSON.stringify(short).length < JSON.stringify(before).length / 3);
  });
});
