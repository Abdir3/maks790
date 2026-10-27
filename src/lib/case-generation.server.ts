import {
  draftContract,
  reviewContract,
  type GeneratedCase,
  type QualityReview,
} from "./case-contract";
import { validateGenerated, reviewPassed, caseSimilarity } from "./case-quality";
import { buildDefinition } from "./generated-case";
import { SYSTEM_INSTRUCTIONS, generationPrompt, reviewPrompt } from "./case-prompt.server";
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
}) {
  let issues: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await args.generate({
      instructions: SYSTEM_INSTRUCTIONS,
      input: generationPrompt(args.draw, args.stages, args.recent, issues),
      schemaName: "case_draft_v2",
      schema: draftContract.json,
      effort: "medium",
    });
    const parsed = draftContract.validator.safeParse(result);
    if (!parsed.success) {
      issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).slice(0, 12);
      continue;
    }
    const generated = parsed.data;
    issues = validateGenerated(generated, args.draw, args.stages, args.draw.sourceIds);
    if (issues.length) continue;
    const definition = buildDefinition(args.id, generated, args.draw);
    if (args.recent.some((previous) => caseSimilarity(definition, previous) > 0.78)) {
      issues = ["Casen er for lik et tidligere forløp."];
      continue;
    }
    const reviewed = reviewContract.validator.safeParse(
      await args.generate({
        instructions: SYSTEM_INSTRUCTIONS,
        input: reviewPrompt(generated, args.draw, args.recent),
        schemaName: "case_review_v2",
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
        review: reviewed.data,
        sourceVersion: SOURCE_VERSION,
        sourceIds: args.draw.sourceIds,
        createdAt: new Date().toISOString(),
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
  review: QualityReview;
  sourceVersion: string;
  sourceIds: string[];
  createdAt: string;
};
