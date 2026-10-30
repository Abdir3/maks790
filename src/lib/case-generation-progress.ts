// Public milestones only. Never send drafts, diagnoses or provider identifiers.
export const GENERATION_PHASES = [
  "preparing",
  "queued",
  "writing",
  "repairing",
  "saving",
  "completed",
] as const;
export type GenerationPhase = (typeof GENERATION_PHASES)[number];
export type GenerationProgress = { phase: GenerationPhase };

export function readGenerationProgress(value: unknown): GenerationProgress | undefined {
  if (!value || typeof value !== "object" || !("phase" in value)) return undefined;
  const phase = value.phase;
  return typeof phase === "string" && GENERATION_PHASES.includes(phase as GenerationPhase)
    ? { phase: phase as GenerationPhase }
    : undefined;
}

export function generationProgress(
  steps: readonly {
    status?: "queued" | "in_progress" | "completed";
    output?: unknown;
  }[],
  needsNextRequest = false,
): GenerationProgress {
  const step = steps.at(-1);
  if (!step) return { phase: "preparing" };
  if (needsNextRequest) return { phase: "repairing" };
  if (Object.hasOwn(step, "output")) return { phase: "saving" };
  if (steps.length > 1) return { phase: "repairing" };
  return { phase: step.status === "queued" ? "queued" : "writing" };
}
