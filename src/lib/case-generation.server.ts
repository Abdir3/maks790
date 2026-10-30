import {
  draftContract,
  blindSolutionContract,
  type BlindSolution,
  reviewContract,
  type GeneratedCase,
  type QualityReview,
} from "./case-contract";
import {
  validateGenerated,
  reviewPassed,
  caseSimilarity,
  validateBlindSolution,
} from "./case-quality";
import { buildDefinition, normaliseClinicalData } from "./generated-case";
import {
  SYSTEM_INSTRUCTIONS,
  generationPrompt,
  reviewPrompt,
  blindSolutionPrompt,
} from "./case-prompt.server";
import { SOURCE_VERSION } from "./case-sources.server";
import type { VarietyDraw } from "./case-variety";
import type { CaseDefinition } from "./case-model";

export type JsonGenerator = (args: {
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
  effort?: "low" | "medium" | "high";
}) => Promise<unknown>;
export async function generateValidatedCase(args: {
  id: string;
  draw: VarietyDraw;
  stages: number;
  recent: CaseDefinition[];
  generate: JsonGenerator;
  // Extra model reviews are for offline calibration, never the interactive path.
  independentReview?: boolean;
}) {
  let issues: string[] = [];
  let rejected: GeneratedCase | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await args.generate({
      instructions: SYSTEM_INSTRUCTIONS,
      input: generationPrompt(args.draw, args.stages, args.recent, issues, rejected),
      schemaName: "case_draft_v3",
      schema: draftContract.json,
      effort: "medium",
    });
    const parsed = draftContract.validator.safeParse(result);
    if (!parsed.success) {
      issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).slice(0, 12);
      continue;
    }
    const generated = normaliseClinicalData(parsed.data);
    rejected = generated;
    issues = validateGenerated(generated, args.draw, args.stages, args.draw.sourceIds);
    if (issues.length) continue;
    const definition = buildDefinition(args.id, generated, args.draw);
    if (args.recent.some((previous) => caseSimilarity(definition, previous) > 0.78)) {
      issues = ["Casen er for lik et tidligere forløp."];
      continue;
    }
    const assessment: Assessment = {
      generated,
      validationMode: args.independentReview ? "independent" : "automatic",
      sourceVersion: SOURCE_VERSION,
      sourceIds: args.draw.sourceIds,
      createdAt: new Date().toISOString(),
    };
    // The same Astra draft, clinical prompt and deterministic checks are retained.
    // A valid case is ready immediately; do not buy two more model responses.
    if (!args.independentReview) return { definition, assessment, attempts: attempt + 1 };
    const solved = blindSolutionContract.validator.safeParse(
      await args.generate({
        instructions:
          "Du er en uavhengig klinisk underviser. Løs bare fra oppgitte studentdata; ikke gjett manglende undersøkelser.",
        input: blindSolutionPrompt(definition),
        schemaName: "case_blind_v3",
        schema: blindSolutionContract.json,
        effort: "medium",
      }),
    );
    if (!solved.success) {
      issues = ["Den uavhengige løsningen hadde ugyldig struktur."];
      continue;
    }
    issues = validateBlindSolution(solved.data, definition);
    if (issues.length) continue;
    const reviewed = reviewContract.validator.safeParse(
      await args.generate({
        instructions: SYSTEM_INSTRUCTIONS,
        input: reviewPrompt(generated, args.draw, args.recent, definition, solved.data),
        schemaName: "case_review_v3",
        schema: reviewContract.json,
        effort: "medium",
      }),
    );
    if (!reviewed.success) {
      issues = ["Kvalitetskontrollen hadde ugyldig struktur."];
      continue;
    }
    if (!reviewPassed(reviewed.data)) {
      issues = reviewed.data.issues.length
        ? reviewed.data.issues
        : ["Kvalitetskontrollen kunne ikke bekrefte alle krav."];
      continue;
    }
    return {
      definition,
      assessment: {
        ...assessment,
        blindSolution: solved.data,
        review: reviewed.data,
      },
      attempts: attempt + 1,
    };
  }
  // Do not reveal failed drafts or their diagnoses to the student.
  throw new Error(
    "Casen hadde ufullstendige eller motstridende opplysninger etter to forsøk. Ingen case er lagret. Prøv et annet tema eller startsted.",
  );
}
export type Assessment = {
  generated: GeneratedCase;
  blindSolution?: BlindSolution;
  review?: QualityReview;
  validationMode?: "automatic" | "independent";
  sourceVersion: string;
  sourceIds: string[];
  createdAt: string;
};
