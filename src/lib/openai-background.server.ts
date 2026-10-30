import type { JsonGenerator } from "./case-generation.server";
import { AiProviderError, providerErrorFromResponse } from "./ai-gateway.server";

export type ModelRequest = Parameters<JsonGenerator>[0];
export type ModelStep = { hash: string; responseId?: string; output?: unknown; model?: string };
export class PendingModel extends Error {}

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
}): JsonGenerator {
  let index = 0;
  let remoteCalls = 0;
  const transport = options.transport ?? fetch;
  return async (args) => {
    const position = index++;
    if (position >= 6) throw new AiProviderError("unavailable");
    const hash = await digest(args);
    let step = options.steps[position];
    if (step && step.hash !== hash) throw new AiProviderError("unavailable");
    if (step && Object.hasOwn(step, "output")) return step.output;
    if (step && !step.responseId) throw new AiProviderError("unavailable");
    // Each Edge invocation performs at most one provider request, even if a
    // response finishes immediately. Completed steps are replayed from storage.
    if (remoteCalls++ > 0) throw new PendingModel();
    const existingId = step?.responseId;
    if (existingId && !/^resp_[A-Za-z0-9_-]+$/.test(existingId))
      throw new AiProviderError("unavailable");
    if (!step) {
      step = { hash };
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
                  model: "gpt-6-astra",
                  background: true,
                  store: false,
                  instructions: args.instructions,
                  input: args.input,
                  reasoning: { effort: args.effort ?? "medium" },
                  text: {
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
      error?: { code?: string };
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
    if (body.status === "queued" || body.status === "in_progress") {
      await options.save();
      throw new PendingModel();
    }
    if (body.status !== "completed")
      throw await providerErrorFromResponse(Response.json({ error: body.error }, { status: 502 }));
    if (body.model !== "gpt-6-astra" && !body.model?.startsWith("gpt-6-astra-"))
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
    await options.save();
    return step.output;
  };
}
