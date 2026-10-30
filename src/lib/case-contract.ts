import { z } from "zod";

// One definition produces both runtime validation and the model's strict JSON schema.
type Codec<T extends z.ZodTypeAny> = { validator: T; json: Record<string, unknown> };
const str = (min = 1, max = 3000): Codec<z.ZodString> => ({
  validator: z.string().trim().min(min).max(max),
  json: { type: "string", minLength: min, maxLength: max },
});
const num = (min: number, max: number): Codec<z.ZodNumber> => ({
  validator: z.number().finite().min(min).max(max),
  json: { type: "number", minimum: min, maximum: max },
});
const choice = <const T extends [string, ...string[]]>(values: T): Codec<z.ZodEnum<T>> => ({
  validator: z.enum(values),
  json: { type: "string", enum: values },
});
const arr = <T extends z.ZodTypeAny>(item: Codec<T>, min = 0, max = 12): Codec<z.ZodArray<T>> => ({
  validator: z.array(item.validator).min(min).max(max),
  json: { type: "array", items: item.json, minItems: min, maxItems: max },
});
function obj<T extends Record<string, Codec<z.ZodTypeAny>>>(fields: T) {
  const shape = Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, field.validator]),
  ) as { [K in keyof T]: T[K]["validator"] };
  return {
    validator: z.object(shape).strict(),
    json: {
      type: "object",
      additionalProperties: false,
      required: Object.keys(fields),
      properties: Object.fromEntries(
        Object.entries(fields).map(([key, field]) => [key, field.json]),
      ),
    },
  };
}
const bool: Codec<z.ZodBoolean> = { validator: z.boolean(), json: { type: "boolean" } };
export const SKILLS = [
  "assessment",
  "prioritisation",
  "differential",
  "treatment",
  "reassessment",
  "communication",
  "ethics",
  "medication",
  "disposition",
] as const;
const eventTime = () => num(-525600, 10080);
const medication = obj({
  name: str(1, 160),
  activeIngredient: str(1, 160),
  dose: str(1, 120),
  route: str(1, 100),
  schedule: str(1, 200),
  context: choice(["regular", "given", "reported"]),
  timeMinutes: eventTime(),
  sourceIds: arr(str(1, 80), 1, 4),
});
const laboratory = obj({
  id: str(1, 80),
  label: str(1, 160),
  value: str(1, 500),
  unit: str(0, 50),
  referenceRange: str(1, 160),
  sampleType: str(1, 100),
  timeMinutes: eventTime(),
});
const bloodGas = obj({
  sampleType: choice(["arterial", "venous"]),
  sampledAt: str(1, 120),
  oxygen: str(1, 200),
  pH: num(6.5, 8),
  pCO2: num(0.5, 25),
  pO2: num(0.1, 100),
  timeMinutes: eventTime(),
});
const report = obj({
  kind: choice(["ecg", "imaging"]),
  timeMinutes: eventTime(),
  findings: str(1, 1800),
  conclusion: str(1, 1200),
});
function caseDraftContract(stageCount?: number) {
  // Saved assessments retain the original permissive contract. Only new model
  // requests use the concise contract: a short case must not spend its entire
  // response budget expanding private rubrics or writing unrequested stages.
  const compact = stageCount !== undefined;
  const limit = (original: number, concise: number) => (compact ? concise : original);
  const rubric = obj({
    expected: arr(str(1, limit(3000, 320)), 2, 6),
    alternatives: arr(str(1, limit(3000, 360)), 1, limit(4, 2)),
    critical: arr(str(1, limit(3000, 240)), 0, limit(4, 3)),
    sourceIds: arr(str(1, 80), 1, 6),
  });
  const question = obj({
    prompt: str(20, limit(2000, 500)),
    skill: choice([...SKILLS]),
    temporalScope: choice(["at-time", "whole-case"]),
    rubric,
  });
  return obj({
    patient: str(5, 300),
    ageYears: num(0, 110),
    role: str(5, limit(600, 300)),
    background: arr(str(1, limit(3000, 500)), 1, limit(8, 4)),
    diagnosisFamily: str(2, 160),
    diagnosisAliases: arr(str(2, 100), 1, 8),
    mechanism: str(5, limit(600, 300)),
    presentation: str(5, 400),
    reasoningTarget: str(10, limit(600, 300)),
    pivotalFindings: arr(str(5, limit(500, 240)), 2, 8),
    dossier: str(30, limit(6000, stageCount === 1 ? 1000 : 1400)),
    stages: arr(
      obj({
        setting: str(2, 120),
        elapsedMinutes: num(0, 10080),
        timeLabel: str(2, 120),
        paragraphs: arr(str(1, limit(3000, 600)), 1, limit(6, 4)),
        clinicalFindings: arr(str(1, limit(3000, 300)), 1, 10),
        medications: arr(medication, 0, 16),
        laboratory: arr(laboratory, 0, 24),
        bloodGas: arr(bloodGas, 0, 4),
        reports: arr(report, 0, 6),
        vitals: arr(
          obj({
            id: choice([
              "bp",
              "pulse",
              "respiration",
              "spo2",
              "temperature",
              "gcs",
              "glucose",
              "lactate",
              "consciousness",
              "capillaryRefill",
              "weight",
            ]),
            value: str(1, 160),
            unit: str(0, 30),
            note: str(0, 300),
          }),
          0,
          11,
        ),
        questions: arr(question, stageCount === 1 ? 2 : 1, compact && stageCount !== 1 ? 2 : 4),
      }),
      stageCount ?? 1,
      stageCount ?? 6,
    ),
  });
}
export const draftContract = caseDraftContract();
export function generationDraftContract(stages: number) {
  if (!Number.isInteger(stages) || stages < 1 || stages > 6)
    throw new Error("Ugyldig antall deler.");
  return caseDraftContract(stages);
}
export type GeneratedCase = z.infer<typeof draftContract.validator>;
export const reviewContract = obj({
  coherent: bool,
  clinicallyPlausible: bool,
  fair: bool,
  noDiagnosticLeak: bool,
  sourcesWithinScope: bool,
  matchesBlueprint: bool,
  meaningfullyDifferent: bool,
  rubricAcceptsAlternatives: bool,
  noUnsupportedHighRiskAdvice: bool,
  issues: arr(str(), 0, 12),
});
export type QualityReview = z.infer<typeof reviewContract.validator>;
export const blindSolutionContract = obj({
  summary: str(20, 2000),
  questions: arr(
    obj({
      questionId: str(1, 120),
      conclusion: str(10, 1500),
      supportingFindings: arr(str(3, 600), 1, 6),
      alternative: str(10, 1500),
      clinicalConsequence: str(10, 1500),
      missingDecisiveData: arr(str(), 0, 8),
      requiresReasoning: bool,
    }),
    1,
    24,
  ),
});
export type BlindSolution = z.infer<typeof blindSolutionContract.validator>;
export const feedbackContract = obj({
  summary: str(10, 1500),
  questions: arr(
    obj({
      questionId: str(1, 120),
      status: choice(["developed", "partial", "needs-review", "unanswered"]),
      evidence: str(0, 1000),
      strengths: arr(str(), 0, 4),
      improvements: arr(str(), 0, 5),
      alternatives: arr(str(), 1, 4),
      safety: arr(str(), 0, 4),
      nextStep: str(10, 1000),
      sourceIds: arr(str(1, 80), 1, 6),
    }),
    1,
    24,
  ),
});
export type CaseFeedback = z.infer<typeof feedbackContract.validator>;
export const modelAnswerContract = obj({
  summary: str(10, 2000),
  questions: arr(
    obj({
      questionId: str(1, 120),
      explanation: str(30, 5000),
      keyFindings: arr(str(), 1, 8),
      alternatives: arr(str(), 1, 5),
      sourceIds: arr(str(1, 80), 1, 6),
    }),
    1,
    24,
  ),
});
export type ModelAnswer = z.infer<typeof modelAnswerContract.validator>;
export type SourceLink = { id: string; title: string; url: string; scope: string };
