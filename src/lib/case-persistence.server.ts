import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Json } from "../integrations/supabase/types";
import { blindSolutionContract, draftContract, reviewContract } from "./case-contract";
import type { Assessment } from "./case-generation.server";
import type { CaseDefinition } from "./case-model";
import { publicDefinition } from "./generated-case";
import { SOURCE_VERSION } from "./case-sources.server";
import type { HistoryEntry, VarietyDraw } from "./case-variety";

type DataClient = Pick<SupabaseClient<Database>, "from" | "rpc">;
const asJson = (value: unknown): Json => JSON.parse(JSON.stringify(value)) as Json;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b, "en"))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

const assessmentSchema = z.object({
  generated: draftContract.validator,
  review: reviewContract.validator,
  blindSolution: blindSolutionContract.validator.optional(),
  sourceVersion: z.literal(SOURCE_VERSION),
  sourceIds: z.array(z.string()).min(1),
  createdAt: z.string().datetime(),
});

const semanticSchema = z.object({
  topicId: z.string(),
  blueprintId: z.string(),
  pattern: z.string(),
  decision: z.string(),
  trajectory: z.string(),
  fingerprint: z.string(),
  settingId: z.string(),
  diagnosisFamily: z.string(),
  mechanism: z.string(),
  presentation: z.string(),
  reasoningTarget: z.string(),
  pivotalFindings: z.array(z.string()),
});

export async function saveCaseWithAssessment(
  admin: DataClient,
  input: {
    id: string;
    userId: string;
    format: "long" | "quick";
    definition: CaseDefinition;
    assessment: Assessment;
    draw: VarietyDraw;
  },
) {
  const definition = publicDefinition(input.definition);
  if (definition.id !== `gen-${input.id}` || definition.practice?.version !== 3)
    throw new Error("Casen har ugyldig lagringsformat.");
  const assessment = assessmentSchema.parse(input.assessment);
  const generated = assessment.generated;
  const semantic = semanticSchema.parse({
    topicId: input.draw.topicId,
    blueprintId: input.draw.blueprintId,
    pattern: input.draw.pattern,
    decision: input.draw.decision,
    trajectory: input.draw.trajectory,
    fingerprint: input.draw.fingerprint,
    settingId: input.draw.settingId,
    diagnosisFamily: generated.diagnosisFamily,
    mechanism: generated.mechanism,
    presentation: generated.presentation,
    reasoningTarget: generated.reasoningTarget,
    pivotalFindings: generated.pivotalFindings,
  });
  // A single PostgreSQL transaction either saves both records or neither.
  // No hidden diagnostic metadata is passed to the public row's columns.
  const { error } = await admin.rpc("create_case_with_assessment", {
    p_id: input.id,
    p_user_id: input.userId,
    p_format: input.format,
    p_definition: asJson(definition),
    p_assessment: asJson(assessment),
    p_semantic: asJson(semantic),
  });
  if (error)
    throw new Error("Casen kunne ikke lagres. Ingen ufullstendig case er lagret. Prøv igjen.");
}

export async function loadOwnedAssessment(
  authenticated: DataClient,
  admin: DataClient,
  userId: string,
  caseId: string,
): Promise<{ definition: CaseDefinition; assessment: Assessment }> {
  // Verify ownership through the authenticated connection before touching the
  // privileged store. Repeat the owner filter on that store as defence in depth.
  const { data: row, error } = await authenticated
    .from("generated_cases")
    .select("id, user_id, definition")
    .eq("id", caseId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !row || row.user_id !== userId || row.id !== caseId)
    throw new Error("Fant ikke en case som tilhører deg.");
  const definition = publicDefinition(row.definition);
  if (definition.practice?.version !== 3)
    throw new Error(
      "Denne eldre casen kan fortsatt brukes til øving, men har ikke vurderingsgrunnlag for den nye tilbakemeldingen og modellbesvarelsen.",
    );
  const { data: privateRow, error: privateError } = await admin
    .from("case_assessments")
    .select("case_id, user_id, version, definition, assessment")
    .eq("case_id", caseId)
    .eq("user_id", userId)
    .maybeSingle();
  if (
    privateError ||
    !privateRow ||
    privateRow.user_id !== userId ||
    privateRow.case_id !== caseId ||
    privateRow.version !== 3
  )
    throw new Error("Vurderingsgrunnlaget er ikke tilgjengelig. Besvarelsen din er beholdt.");
  if (
    definition.id !== `gen-${caseId}` ||
    canonical(definition) !== canonical(publicDefinition(privateRow.definition))
  )
    throw new Error("Casen samsvarer ikke med det lagrede vurderingsgrunnlaget.");
  const assessment = assessmentSchema.safeParse(privateRow.assessment);
  if (!assessment.success)
    throw new Error(
      "Vurderingsgrunnlaget bruker et eldre eller ugyldig kildegrunnlag. Casen og besvarelsen din er beholdt; lag en ny case for oppdatert vurdering.",
    );
  const { blindSolution, ...basis } = assessment.data;
  return { definition, assessment: { ...basis, ...(blindSolution ? { blindSolution } : {}) } };
}

export async function loadCaseHistory(
  authenticated: DataClient,
  admin: DataClient,
  userId: string,
): Promise<{ history: HistoryEntry[]; recent: CaseDefinition[] }> {
  const { data: rows, error } = await authenticated
    .from("generated_cases")
    .select("id, user_id, definition")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(48);
  if (error) throw new Error("Kunne ikke lese casehistorikken. Prøv igjen.");
  const owned = (rows ?? []).filter((row) => row.user_id === userId);
  if (!owned.length) return { history: [], recent: [] };
  const { data: privateRows, error: privateError } = await admin
    .from("case_assessments")
    .select("case_id, user_id, version, semantic")
    .eq("user_id", userId)
    .in(
      "case_id",
      owned.map((row) => row.id),
    );
  if (privateError) throw new Error("Kunne ikke kontrollere casevariasjonen. Prøv igjen.");
  const history: HistoryEntry[] = [];
  for (const row of owned) {
    const record = privateRows?.find(
      (item) => item.case_id === row.id && item.user_id === userId && item.version === 3,
    );
    if (!record) continue; // Legacy cases have no reliable v3 semantic record.
    const semantic = semanticSchema.safeParse(record.semantic);
    if (!semantic.success) throw new Error("Casehistorikken har ugyldig variasjonsgrunnlag.");
    const item = semantic.data;
    history.push({
      engine: item.decision,
      presentation: item.topicId,
      setting: item.settingId,
      diagnosis_family: item.diagnosisFamily,
      fingerprint: item.fingerprint,
      blueprintId: item.blueprintId,
      mechanism: item.mechanism,
      clinicalPresentation: item.presentation,
      reasoningTarget: item.reasoningTarget,
      pivotalFindings: item.pivotalFindings,
    });
  }
  return { history, recent: owned.slice(0, 3).map((row) => publicDefinition(row.definition)) };
}
