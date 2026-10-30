import type { GenerateOptions } from "./case-api-contract";
import type { CaseDefinition } from "./case-model";
import type { GenerationProgress } from "./case-generation-progress";

export type GenerationJob = {
  id: string;
  status: "pending" | "completed" | "failed";
  format: "quick" | "long";
  createdAt: string;
  progress?: GenerationProgress;
  options?: GenerateOptions;
  definition?: CaseDefinition;
  error?: string;
};

export function generationTargetSeconds(format: "quick" | "long") {
  return format === "quick" ? 150 : 180;
}

// A closed dialog or a hidden tab must never unexpectedly replace current work.
export function shouldOpenGeneratedCase(args: {
  requestedJobId: string | null;
  job: GenerationJob | null;
  dialogOpen: boolean;
  pageVisible: boolean;
}) {
  return Boolean(
    args.dialogOpen &&
    args.pageVisible &&
    args.requestedJobId &&
    args.job?.id === args.requestedJobId &&
    args.job.status === "completed" &&
    args.job.definition,
  );
}
