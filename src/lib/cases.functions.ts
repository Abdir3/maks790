import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateCase, type CaseDefinition } from "@/lib/case-model";
import {
  buildDefinition,
  type CasePlan,
  type GeneratedStage,
  type GenerationMeta,
} from "@/lib/generated-case";

const stageSchemaZ = z.object({
  title: z.string(),
  shortTitle: z.string(),
  timeLabel: z.string(),
  paragraphs: z.array(z.string()),
  quote: z.string(),
  list: z.object({ title: z.string(), items: z.array(z.string()) }),
  vitals: z.object({
    timestamp: z.string(),
    values: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        value: z.string(),
        unit: z.string(),
        note: z.string(),
      }),
    ),
  }),
  afterParagraphs: z.array(z.string()),
  questions: z.array(
    z.object({
      label: z.string(),
      prompt: z.string(),
      subquestions: z.array(z.object({ label: z.string(), prompt: z.string() })),
    }),
  ),
});

const planSchemaZ = z.object({
  title: z.string(),
  patient: z.string(),
  specialty: z.string(),
  diagnosisFamily: z.string(),
  dossier: z.string(),
  background: z.array(z.string()),
  stages: z.array(z.object({ title: z.string(), shortTitle: z.string(), focus: z.string() })),
});

const metaSchemaZ = z.object({
  format: z.enum(["long", "quick"]),
  engine: z.string(),
  presentation: z.string(),
  setting: z.string(),
  patientProfile: z.string(),
});

export const planCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        format: z.enum(["long", "quick"]),
        stages: z.number().int().min(1).max(6),
        startSetting: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { drawVariety, excludedDiagnoses } = await import("@/lib/case-variety");
    const { generateJson } = await import("@/lib/ai-gateway.server");
    const { SYSTEM_INSTRUCTIONS, planPrompt, planSchema } = await import("@/lib/case-prompt.server");

    const { data: history } = await context.supabase
      .from("generated_cases")
      .select("engine, presentation, setting, diagnosis_family")
      .order("created_at", { ascending: false })
      .limit(20);

    const recent = history ?? [];
    const draw = drawVariety(recent, data.format);
    const plan = planSchemaZ.parse(
      await generateJson({
        instructions: SYSTEM_INSTRUCTIONS,
        input: planPrompt({
          format: data.format,
          draw,
          stages: data.stages,
          startSetting: data.startSetting,
          excluded: excludedDiagnoses(recent),
        }),
        schemaName: "case_plan",
        schema: planSchema,
      }),
    );

    const stages = plan.stages.slice(0, data.stages);
    return {
      plan: { ...plan, stages: stages.length > 0 ? stages : plan.stages },
      meta: {
        format: data.format,
        engine: draw.engine,
        presentation: draw.presentation,
        setting: draw.setting,
        patientProfile: draw.patientProfile,
      } satisfies GenerationMeta,
    };
  });

export const writeStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        plan: planSchemaZ,
        index: z.number().int().min(0).max(5),
        format: z.enum(["long", "quick"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { generateJson } = await import("@/lib/ai-gateway.server");
    const { SYSTEM_INSTRUCTIONS, stagePrompt, stageSchema } = await import(
      "@/lib/case-prompt.server"
    );

    const stage = stageSchemaZ.parse(
      await generateJson({
        instructions: SYSTEM_INSTRUCTIONS,
        input: stagePrompt({
          plan: data.plan,
          index: data.index,
          total: data.plan.stages.length,
          format: data.format,
        }),
        schemaName: "case_stage",
        schema: stageSchema,
      }),
    );
    return { stage };
  });

export const saveGeneratedCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ plan: planSchemaZ, stages: z.array(stageSchemaZ).min(1), meta: metaSchemaZ }).parse(
      input,
    ),
  )
  .handler(async ({ data, context }) => {
    const caseId = `gen-${crypto.randomUUID()}`;
    const definition = validateCase(
      buildDefinition(caseId, data.plan as CasePlan, data.stages as GeneratedStage[]),
    );

    const { error } = await context.supabase.from("generated_cases").insert({
      id: caseId.replace("gen-", ""),
      user_id: context.userId,
      format: data.meta.format,
      title: definition.title,
      definition: definition as unknown as Record<string, unknown>,
      engine: data.meta.engine,
      presentation: data.meta.presentation,
      diagnosis_family: data.plan.diagnosisFamily,
      setting: data.meta.setting,
      patient_profile: data.meta.patientProfile,
    });
    if (error) throw new Error(`Kunne ikke lagre casen: ${error.message}`);
    return { definition };
  });

export const listMyCases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("generated_cases")
      .select("id, title, format, definition, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      format: row.format as "long" | "quick",
      createdAt: row.created_at as string,
      definition: row.definition as unknown as CaseDefinition,
    }));
  });

export const deleteGeneratedCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("generated_cases").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
