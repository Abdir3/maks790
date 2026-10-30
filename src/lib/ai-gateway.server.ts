// Server-only OpenAI Responses client. Never return provider error bodies to the client.
type JsonSchema = Record<string, unknown>;
export class AiProviderError extends Error {
  constructor(
    readonly code:
      | "credits-exhausted"
      | "usage-limited"
      | "rate-limited"
      | "authentication"
      | "timeout"
      | "unavailable",
  ) {
    super(
      code === "credits-exhausted"
        ? "OpenAI-kontoen som casetjenesten bruker, mangler kreditt. Administrator må kontrollere saldoen hos OpenAI."
        : code === "usage-limited"
          ? "OpenAI-kontoens saldo eller forbruksgrense stopper forespørselen. Administrator må kontrollere OpenAI-kontoen som API-nøkkelen tilhører."
          : code === "rate-limited"
            ? "For mange forespørsler akkurat nå. Prøv igjen om litt."
            : code === "authentication"
              ? "Casetjenestens OpenAI-tilkobling må kontrolleres av administrator."
              : code === "timeout"
                ? "Casetjenesten brukte for lang tid. Prøv igjen."
                : "Casetjenesten fullførte ikke svaret. Prøv igjen.",
    );
    this.name = "AiProviderError";
  }
}

// Providers can return a successful HTTP response followed by a failed SSE event.
// Only known codes affect the user message; never expose arbitrary provider text.
function knownProviderFailure(code: unknown): AiProviderError | undefined {
  if (code === "credit_balance_exhausted") return new AiProviderError("credits-exhausted");
  if (
    [
      "insufficient_quota",
      "billing_hard_limit_reached",
      "project_spend_limit_exceeded",
      "organization_spend_limit_exceeded",
      "organization_usage_limit_exceeded",
      "billing_not_active",
    ].includes(String(code))
  )
    return new AiProviderError("usage-limited");
  if (["rate_limit_exceeded", "slow_down"].includes(String(code)))
    return new AiProviderError("rate-limited");
  if (["invalid_api_key", "authentication_error"].includes(String(code)))
    return new AiProviderError("authentication");
  return undefined;
}
/** Read only a bounded error body; raw provider messages never leave this boundary. */
export async function providerErrorFromResponse(response: Response): Promise<AiProviderError> {
  const reader = response.body?.getReader();
  let body = "";
  if (reader) {
    const decoder = new TextDecoder();
    let bytes = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 16384) {
          body = "";
          break;
        }
        body += decoder.decode(chunk.value, { stream: true });
      }
      body += decoder.decode();
    } catch {
      body = "";
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }
  try {
    const parsed = JSON.parse(body) as {
      code?: unknown;
      error?: { code?: unknown; type?: unknown };
    };
    const known = knownProviderFailure(parsed?.error?.code ?? parsed?.code ?? parsed?.error?.type);
    if (known) return known;
  } catch {
    /* Non-JSON and oversized responses use the safe HTTP fallback. */
  }
  return new AiProviderError(
    response.status === 402
      ? "credits-exhausted"
      : response.status === 429
        ? "rate-limited"
        : response.status === 401 || response.status === 403
          ? "authentication"
          : "unavailable",
  );
}
/** Provider provenance for local calibration; never contains prompts or credentials. */
export type ResponseMetadata = {
  id?: string | undefined;
  model?: string | undefined;
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  reasoningTokens?: number | undefined;
};
export async function readResponseJson(
  body: ReadableStream<Uint8Array>,
  onResponse?: (metadata: ResponseMetadata) => void,
): Promise<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "",
    text = "",
    completed = false;
  function consume(line: string) {
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
    let event: {
      type?: string;
      delta?: string;
      code?: string;
      error?: { code?: string };
      response?: {
        id?: string;
        model?: string;
        status?: string;
        error?: { code?: string };
        usage?: {
          input_tokens?: number;
          output_tokens?: number;
          output_tokens_details?: { reasoning_tokens?: number };
        };
        output_text?: string;
        output?: { content?: { type?: string; text?: string }[] }[];
      };
    };
    try {
      event = JSON.parse(payload);
    } catch {
      throw new AiProviderError("unavailable");
    }
    if (["error", "response.failed", "response.incomplete"].includes(event.type ?? ""))
      throw (
        knownProviderFailure(event.response?.error?.code ?? event.error?.code ?? event.code) ??
        new AiProviderError("unavailable")
      );
    if (event.type === "response.output_text.delta" && typeof event.delta === "string")
      text += event.delta;
    if (event.type === "response.completed") {
      if (event.response?.status && event.response.status !== "completed")
        throw new AiProviderError("unavailable");
      completed = true;
      const final =
        event.response?.output_text ??
        event.response?.output
          ?.flatMap((o) => o.content ?? [])
          .filter((c) => c.type === "output_text")
          .map((c) => c.text ?? "")
          .join("");
      if (final) text = final;
      const response = event.response;
      const tokens = (value: unknown) =>
        typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
      const inputTokens = tokens(response?.usage?.input_tokens);
      const outputTokens = tokens(response?.usage?.output_tokens);
      const reasoningTokens = tokens(response?.usage?.output_tokens_details?.reasoning_tokens);
      onResponse?.({
        ...(typeof response?.id === "string" ? { id: response.id } : {}),
        ...(typeof response?.model === "string" ? { model: response.model } : {}),
        ...(inputTokens === undefined ? {} : { inputTokens }),
        ...(outputTokens === undefined ? {} : { outputTokens }),
        ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
      });
    }
    if (text.length > 250000) throw new AiProviderError("unavailable");
  }
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      if (buffer.length > 500000) throw new AiProviderError("unavailable");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      lines.forEach(consume);
    }
    buffer += decoder.decode();
    if (buffer.trim()) consume(buffer);
    if (!completed || !text.trim()) throw new AiProviderError("unavailable");
    try {
      return JSON.parse(text);
    } catch {
      throw new AiProviderError("unavailable");
    }
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError"))
      throw new AiProviderError("timeout");
    throw new AiProviderError("unavailable");
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
export async function generateJson({
  instructions,
  input,
  schemaName,
  schema,
  effort = "medium",
  onResponse,
}: {
  instructions: string;
  input: string;
  schemaName: string;
  schema: JsonSchema;
  effort?: "low" | "medium" | "high";
  onResponse?: (metadata: ResponseMetadata) => void;
}): Promise<unknown> {
  const apiKey = process.env["OPENAI_API_KEY"]?.trim();
  if (!apiKey) throw new AiProviderError("authentication");
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(240000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-6-astra",
        store: false,
        instructions,
        input,
        stream: true,
        reasoning: { effort },
        text: { format: { type: "json_schema", name: schemaName, strict: true, schema } },
      }),
    });
    if (!response.ok || !response.body) throw await providerErrorFromResponse(response);
    return await readResponseJson(response.body, onResponse);
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError"))
      throw new AiProviderError("timeout");
    throw new AiProviderError("unavailable");
  }
}
