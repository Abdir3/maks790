import type { JsonGenerator } from "./case-generation.server";
import { AiProviderError, providerErrorFromResponse } from "./ai-gateway.server";
import { CASE_MODEL, CASE_SERVICE_TIER, requestBudget } from "./ai-policy.server";

export type ModelRequest = Parameters<JsonGenerator>[0];
export type ModelStep = {
  hash: string;
  responseId?: string;
  output?: unknown;
  model?: string;
  serviceTier?: string;
  requestedModel?: string;
  maximumCostUsd?: number;
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  reasoningTokens?: number | undefined;
  cacheWriteTokens?: number | undefined;
  cachedInputTokens?: number | undefined;
  status?: "queued" | "in_progress" | "completed";
};
export class PendingModel extends Error {
  constructor(readonly needsNextRequest = false) {
    super();
  }
}

export async function digest(value: unknown): Promise<string> {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function createBackgroundGenerator(options: {
  apiKey: string;
  steps: ModelStep[];
  save: () => Promise<void>;
  transport?: typeof fetch;
  maxSteps?: number;
  maxOutputTokens?: number;
  beforeSubmit?: (reservation: {
    step: number;
    requestHash: string;
    maximumCostUsd: number;
  }) => Promise<void>;
}): JsonGenerator {
  let index = 0;
  let remoteCalls = 0;
  const transport = options.transport ?? fetch;
  return async (args) => {
    const position = index++;
    if (position >= Math.min(options.maxSteps ?? 4, 4)) throw new AiProviderError("spend-limit");
    const hash = await digest(args);
    let step = options.steps[position];
    if (step && step.hash !== hash) throw new AiProviderError("unavailable");
    if (step && Object.hasOwn(step, "output")) return step.output;
    if (step && !step.responseId) throw new AiProviderError("unavailable");
    // Each Edge invocation performs at most one provider request, even if a
    // response finishes immediately. Completed steps are replayed from storage.
    if (remoteCalls++ > 0) throw new PendingModel(true);
    const existingId = step?.responseId;
    if (existingId && !/^resp_[A-Za-z0-9_-]+$/.test(existingId))
      throw new AiProviderError("unavailable");
    if (!step) {
      const budget = requestBudget(args, options.maxOutputTokens);
      if (!budget) throw new AiProviderError("spend-limit");
      await options.beforeSubmit?.({
        step: position,
        requestHash: hash,
        maximumCostUsd: budget.maximumCostUsd,
      });
      step = { hash, requestedModel: CASE_MODEL, maximumCostUsd: budget.maximumCostUsd };
      options.steps.push(step);
      // Persist intent before contacting OpenAI. An interrupted submission fails
      // closed on resume instead of silently buying a duplicate generation.
      await options.save();
    }
    let response: Response;
    try {
      response = await transport(
        `https://api.openai.com/v1/responses${existingId ? `/${existingId}` : ""}`,
        {
          method: existingId ? "GET" : "POST",
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json",
          },
          redirect: "error",
          signal: AbortSignal.timeout(30000),
          ...(existingId
            ? {}
            : {
                body: JSON.stringify({
                  model: CASE_MODEL,
                  service_tier: CASE_SERVICE_TIER,
                  max_output_tokens: requestBudget(args, options.maxOutputTokens)!.maxOutputTokens,
                  background: true,
                  store: false,
                  instructions: args.instructions,
                  input: args.input,
                  reasoning: { effort: args.effort ?? "medium" },
                  text: {
                    verbosity: args.schemaName === "case_draft_v3" ? "low" : "medium",
                    format: {
                      type: "json_schema",
                      name: args.schemaName,
                      strict: true,
                      schema: args.schema,
                    },
                  },
                }),
              }),
        },
      );
    } catch {
      throw new AiProviderError("unavailable");
    }
    if (!response.ok) throw await providerErrorFromResponse(response);
    const body = (await response.json()) as {
      id?: string;
      status?: string;
      model?: string;
      service_tier?: string;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        input_tokens_details?: { cached_tokens?: number; cache_write_tokens?: number };
        output_tokens_details?: { reasoning_tokens?: number };
      };
      error?: { code?: string };
      incomplete_details?: { reason?: string };
      output_text?: string;
      output?: { content?: { type?: string; text?: string }[] }[];
    };
    if (
      !body.id ||
      !/^resp_[A-Za-z0-9_-]+$/.test(body.id) ||
      (existingId && body.id !== existingId)
    )
      throw new AiProviderError("unavailable");
    step.responseId = body.id;
    if (body.service_tier) step.serviceTier = body.service_tier;
    if (body.model) step.model = body.model;
    const count = (value: unknown) =>
      typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
    step.inputTokens = count(body.usage?.input_tokens);
    step.outputTokens = count(body.usage?.output_tokens);
    step.reasoningTokens = count(body.usage?.output_tokens_details?.reasoning_tokens);
    step.cachedInputTokens = count(body.usage?.input_tokens_details?.cached_tokens);
    step.cacheWriteTokens = count(body.usage?.input_tokens_details?.cache_write_tokens);
    if (body.status === "queued" || body.status === "in_progress") {
      step.status = body.status;
      await options.save();
      throw new PendingModel();
    }
    if (body.status === "incomplete" && body.incomplete_details?.reason === "max_output_tokens")
      throw new AiProviderError("output-limit");
    if (body.status !== "completed")
      throw await providerErrorFromResponse(Response.json({ error: body.error }, { status: 502 }));
    if (body.model !== CASE_MODEL && !body.model?.startsWith(`${CASE_MODEL}-`))
      throw new AiProviderError("unavailable");
    const output =
      body.output_text ??
      body.output
        ?.flatMap((o) => o.content ?? [])
        .filter((c) => c.type === "output_text")
        .map((c) => c.text ?? "")
        .join("");
    if (!output || output.length > 250000) throw new AiProviderError("unavailable");
    try {
      step.output = JSON.parse(output);
    } catch {
      throw new AiProviderError("unavailable");
    }
    step.model = body.model;
    step.status = "completed";
    await options.save();
    return step.output;
  };
}
