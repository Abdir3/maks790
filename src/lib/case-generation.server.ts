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
import type { ResponseMetadata } from "./ai-gateway.server";

export type JsonGenerator = (args: {
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
  effort?: "low" | "medium" | "high";
  onResponse?: (metadata: ResponseMetadata) => void;
}) => Promise<unknown>;
export async function generateValidatedCase(args: {
  id: string;
  draw: VarietyDraw;
  stages: number;
  recent: CaseDefinition[];
  generate: JsonGenerator;
}) {
  let issues: string[] = [];
  let rejected: GeneratedCase | undefined;
  const modelResponses: { purpose: string; response: ResponseMetadata }[] = [];
  const generate: JsonGenerator = (request) =>
    args.generate({
      ...request,
      onResponse: (response) => modelResponses.push({ purpose: request.schemaName, response }),
    });
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await generate({
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
    const solved = blindSolutionContract.validator.safeParse(
      await generate({
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
      await generate({
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
        generated,
        blindSolution: solved.data,
        review: reviewed.data,
        sourceVersion: SOURCE_VERSION,
        sourceIds: args.draw.sourceIds,
        createdAt: new Date().toISOString(),
        ...(modelResponses.length ? { modelResponses } : {}),
      },
      attempts: attempt + 1,
    };
  }
  // Do not reveal failed drafts or their diagnoses to the student.
  throw new Error(
    "Casen bestod ikke kvalitetskontrollen etter to forsøk. Ingen case er lagret. Prøv et annet tema eller startsted.",
  );
}
export type Assessment = {
  generated: GeneratedCase;
  blindSolution?: BlindSolution;
  review: QualityReview;
  sourceVersion: string;
  sourceIds: string[];
  createdAt: string;
  modelResponses?: { purpose: string; response: ResponseMetadata }[];
};
