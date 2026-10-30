// Browser calls go directly to the authenticated Supabase Edge Function.
import { createClientOnlyFn } from "@tanstack/react-start";
import { callCaseApi, requestCaseApi } from "./case-api.client";
import type { GenerateOptions, AnswerInput } from "./case-api-contract";
import type { CaseDefinition } from "./case-model";
import type { CaseFeedback, ModelAnswer } from "./case-contract";
import type { sourcesFor } from "./case-sources.server";
import type { GenerationProgress } from "./case-generation-progress";
import type { GenerationJob } from "./case-generation-job";
type Sources = ReturnType<typeof sourcesFor>;

export const startCaseGeneration = createClientOnlyFn(
  ({ data, requestId, owner }: { data: GenerateOptions; requestId: string; owner: string }) =>
    requestCaseApi<{ definition: CaseDefinition }>({ action: "generate", requestId, data }, owner),
);
export const getGenerationStatus = createClientOnlyFn(async (owner: string) => {
  const response = await requestCaseApi<{ job: GenerationJob | null }>(
    { action: "generation-status" },
    owner,
  );
  if (response.status !== "completed" || !response.result || !("job" in response.result))
    throw new Error("Kunne ikke hente status for casen.");
  return response.result.job;
});

export const generateCase = createClientOnlyFn(
  ({
    data,
    onProgress,
  }: {
    data: GenerateOptions;
    onProgress?: (progress: GenerationProgress) => void;
  }) =>
    callCaseApi<{ definition: CaseDefinition }>(
      {
        action: "generate",
        requestId: crypto.randomUUID(),
        data,
      },
      onProgress,
    ),
);
export const assessCase = createClientOnlyFn(({ data }: { data: AnswerInput }) =>
  callCaseApi<{ feedback: CaseFeedback; sources: Sources }>({
    action: "assess",
    requestId: crypto.randomUUID(),
    data,
  }),
);
export const getModelAnswer = createClientOnlyFn(({ data }: { data: { id: string } }) =>
  callCaseApi<{ modelAnswer: ModelAnswer; sources: Sources }>({
    action: "model",
    requestId: crypto.randomUUID(),
    data,
  }),
);
export const listMyCases = createClientOnlyFn(() =>
  callCaseApi<
    {
      id: string;
      title: string;
      format: "long" | "quick";
      createdAt: string;
      definition: CaseDefinition;
    }[]
  >({ action: "list" }),
);
export const deleteGeneratedCase = createClientOnlyFn(({ data }: { data: { id: string } }) =>
  callCaseApi<{ ok: boolean }>({ action: "delete", data }),
);
