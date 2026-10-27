import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { publicDefinition } from "@/lib/generated-case";
import { DIFFICULTIES, START_SETTINGS, TOPICS } from "@/lib/case-variety";

const optionsSchema = z
  .object({
    format: z.enum(["long", "quick"]),
    stages: z.number().int().min(1).max(6),
    startSetting: z.enum(
      START_SETTINGS.map((s) => s.id) as [
        (typeof START_SETTINGS)[number]["id"],
        ...(typeof START_SETTINGS)[number]["id"][],
      ],
    ),
    difficulty: z.enum(DIFFICULTIES),
    topic: z
      .string()
      .max(80)
      .refine((t) => t === "auto" || TOPICS.some((topic) => topic.id === t)),
  })
  .strict()
  .refine(
    (o) => (o.format === "quick" ? o.stages === 1 : o.stages >= 3),
    "Ugyldig antall deler for valgt format.",
  );

export const generateCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => optionsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { withCaseOperation } = await import("@/lib/case-operation.server");
    return withCaseOperation(context.userId, async () => {
      const { drawVariety } = await import("@/lib/case-variety");
      const { generateJson } = await import("@/lib/ai-gateway.server");
      const { generateValidatedCase } = await import("@/lib/case-generation.server");
      const { sealAssessment, assessmentSecret } = await import("@/lib/case-assessment.server");
      const secret = assessmentSecret();
      const { data: history, error } = await context.supabase
        .from("generated_cases")
        .select("engine, presentation, setting, diagnosis_family, definition")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(48);
      if (error)
        throw new Error("Kunne ikke lese casehistorikken. Prøv igjen før du lager en ny case.");
      const draw = drawVariety(history ?? [], data);
      const recent = (history ?? []).slice(0, 3).map((row) => publicDefinition(row.definition));
      const id = crypto.randomUUID();
      const result = await generateValidatedCase({
        id: `gen-${id}`,
        draw,
        stages: data.stages,
        recent,
        generate: generateJson,
      });
      const sealed = await sealAssessment(
        result.assessment,
        context.userId,
        result.definition,
        secret,
      );
      const { error: saveError } = await context.supabase.from("generated_cases").insert({
        id,
        user_id: context.userId,
        format: data.format,
        title: result.definition.title,
        definition: JSON.parse(JSON.stringify({ ...result.definition, _assessment: sealed })),
        engine: draw.decision,
        presentation: draw.topicId,
        diagnosis_family: draw.fingerprint,
        setting: draw.settingId,
        patient_profile: `${result.assessment.generated.ageYears} år`,
      });
      if (saveError) throw new Error("Casen ble kontrollert, men kunne ikke lagres. Prøv igjen.");
      return { definition: result.definition };
    });
  });

export const assessCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        answers: z
          .record(z.string().max(18000))
          .refine(
            (a) => Object.keys(a).length <= 18 && Object.values(a).join("").length <= 80000,
            "Besvarelsen er for stor.",
          ),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { withCaseOperation } = await import("@/lib/case-operation.server");
    return withCaseOperation(context.userId, async () => {
      const { openAssessment, assessmentSecret } = await import("@/lib/case-assessment.server");
      const { generateFeedback } = await import("@/lib/case-feedback.server");
      const { generateJson } = await import("@/lib/ai-gateway.server");
      const { sourcesFor, SOURCE_VERSION } = await import("@/lib/case-sources.server");
      const { draftContract, reviewContract } = await import("@/lib/case-contract");
      const { allQuestions } = await import("@/lib/case-model");
      const { data: row, error } = await context.supabase
        .from("generated_cases")
        .select("definition")
        .eq("user_id", context.userId)
        .eq("id", data.id)
        .maybeSingle();
      if (error || !row) throw new Error("Fant ikke en case som tilhører deg.");
      const definition = publicDefinition(row.definition);
      const sealed = (row.definition as Record<string, unknown>)["_assessment"];
      if (typeof sealed !== "string")
        throw new Error("Denne eldre casen har ikke et kontrollert vurderingsgrunnlag.");
      const payload = await openAssessment(sealed, context.userId, definition, assessmentSecret());
      const assessment = z
        .object({
          generated: draftContract.validator,
          review: reviewContract.validator,
          sourceVersion: z.literal(SOURCE_VERSION),
          sourceIds: z.array(z.string()),
          createdAt: z.string(),
        })
        .safeParse(payload);
      if (!assessment.success)
        throw new Error(
          "Denne casen bruker et eldre eller ugyldig vurderingsgrunnlag. Lag en ny case for oppdatert tilbakemelding.",
        );
      const ids = new Set(allQuestions(definition).map((q) => q.id));
      if (Object.keys(data.answers).some((id) => !ids.has(id)))
        throw new Error("Besvarelsen inneholder ukjente oppgaver.");
      const feedback = await generateFeedback(
        definition,
        assessment.data,
        data.answers,
        generateJson,
      );
      return { feedback, sources: sourcesFor(assessment.data.sourceIds) };
    });
  });

export const listMyCases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("generated_cases")
      .select("id, title, format, definition, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error("Kunne ikke hente casene dine.");
    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      format: row.format as "long" | "quick",
      createdAt: row.created_at,
      definition: publicDefinition(row.definition),
    }));
  });
export const deleteGeneratedCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("generated_cases")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error("Kunne ikke slette casen.");
    return { ok: true };
  });
