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
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { loadCaseHistory, saveCaseWithAssessment } =
        await import("@/lib/case-persistence.server");
      const { history, recent } = await loadCaseHistory(
        context.supabase,
        supabaseAdmin,
        context.userId,
      );
      const draw = drawVariety(history, data);
      const id = crypto.randomUUID();
      const result = await generateValidatedCase({
        id: `gen-${id}`,
        draw,
        stages: data.stages,
        recent,
        generate: generateJson,
      });
      await saveCaseWithAssessment(supabaseAdmin, {
        id,
        userId: context.userId,
        format: data.format,
        definition: result.definition,
        assessment: result.assessment,
        draw,
      });
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
            (a) => Object.keys(a).length <= 24 && Object.values(a).join("").length <= 80000,
            "Besvarelsen er for stor.",
          ),
        solutionViewed: z.boolean().optional().default(false),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { withCaseOperation } = await import("@/lib/case-operation.server");
    return withCaseOperation(context.userId, async () => {
      const { generateFeedback } = await import("@/lib/case-feedback.server");
      const { generateJson } = await import("@/lib/ai-gateway.server");
      const { sourcesFor } = await import("@/lib/case-sources.server");
      const { allQuestions } = await import("@/lib/case-model");
      const { loadOwnedAssessment } = await import("@/lib/case-persistence.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { definition, assessment } = await loadOwnedAssessment(
        context.supabase,
        supabaseAdmin,
        context.userId,
        data.id,
      );
      const ids = new Set(allQuestions(definition).map((q) => q.id));
      if (Object.keys(data.answers).some((id) => !ids.has(id)))
        throw new Error("Besvarelsen inneholder ukjente oppgaver.");
      const feedback = await generateFeedback(definition, assessment, data.answers, generateJson, {
        solutionViewed: data.solutionViewed,
      });
      return { feedback, sources: sourcesFor(assessment.sourceIds) };
    });
  });

export const getModelAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { withCaseOperation } = await import("@/lib/case-operation.server");
    return withCaseOperation(context.userId, async () => {
      const { loadOwnedAssessment } = await import("@/lib/case-persistence.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { generateModelAnswer } = await import("@/lib/case-feedback.server");
      const { generateJson } = await import("@/lib/ai-gateway.server");
      const { sourcesFor } = await import("@/lib/case-sources.server");
      const { definition, assessment } = await loadOwnedAssessment(
        context.supabase,
        supabaseAdmin,
        context.userId,
        data.id,
      );
      const modelAnswer = await generateModelAnswer(definition, assessment, generateJson);
      return { modelAnswer, sources: sourcesFor(assessment.sourceIds) };
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
