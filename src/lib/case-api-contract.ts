import { z } from "zod";
import { DIFFICULTIES, START_SETTINGS, TOPICS } from "./case-variety";

export const optionsSchema = z
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

export const caseIdSchema = z.object({ id: z.string().uuid() }).strict();
export const answerInputSchema = z
  .object({
    id: z.string().uuid(),
    answers: z
      .record(z.string().max(18000))
      .refine((a) => Object.keys(a).length <= 24 && Object.values(a).join("").length <= 80000),
    solutionViewed: z.boolean().optional().default(false),
  })
  .strict();
export type GenerateOptions = z.infer<typeof optionsSchema>;
export type AnswerInput = z.input<typeof answerInputSchema>;

export const actionSchema = z.discriminatedUnion("action", [
  z
    .object({ action: z.literal("generate"), requestId: z.string().uuid(), data: optionsSchema })
    .strict(),
  z
    .object({ action: z.literal("assess"), requestId: z.string().uuid(), data: answerInputSchema })
    .strict(),
  z
    .object({ action: z.literal("model"), requestId: z.string().uuid(), data: caseIdSchema })
    .strict(),
  z.object({ action: z.literal("poll"), jobId: z.string().uuid() }).strict(),
  z.object({ action: z.literal("generation-status") }).strict(),
  z.object({ action: z.literal("list") }).strict(),
  z.object({ action: z.literal("delete"), data: caseIdSchema }).strict(),
  z
    .object({
      action: z.literal("transcribe"),
      data: z
        .object({
          audio: z
            .string()
            .min(1)
            .max(16000000)
            .regex(/^[A-Za-z0-9+/]*={0,2}$/),
          mimeType: z
            .string()
            .max(80)
            .regex(/^audio\/(webm|mp4|mpeg|wav|ogg)(;codecs=[a-z0-9,-]+)?$/i),
          languageCode: z.string().max(12).optional(),
        })
        .strict(),
    })
    .strict(),
]);
