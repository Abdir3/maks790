// Server-only Lovable Responses gateway. Never return provider error bodies to the client.
type JsonSchema = Record<string, unknown>;
export async function readResponseJson(body: ReadableStream<Uint8Array>): Promise<unknown> {
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
      response?: {
        status?: string;
        output_text?: string;
        output?: { content?: { type?: string; text?: string }[] }[];
      };
    };
    try {
      event = JSON.parse(payload);
    } catch {
      throw new Error("Ugyldig svar fra casetjenesten.");
    }
    if (["error", "response.failed", "response.incomplete"].includes(event.type ?? ""))
      throw new Error("Casetjenesten fullførte ikke svaret. Prøv igjen.");
    if (event.type === "response.output_text.delta" && typeof event.delta === "string")
      text += event.delta;
    if (event.type === "response.completed") {
      if (event.response?.status && event.response.status !== "completed")
        throw new Error("Casetjenesten fullførte ikke svaret.");
      completed = true;
      const final =
        event.response?.output_text ??
        event.response?.output
          ?.flatMap((o) => o.content ?? [])
          .filter((c) => c.type === "output_text")
          .map((c) => c.text ?? "")
          .join("");
      if (final) text = final;
    }
    if (text.length > 250000) throw new Error("Svaret fra casetjenesten er for stort.");
  }
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      if (buffer.length > 500000) throw new Error("Ugyldig datastrøm fra casetjenesten.");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      lines.forEach(consume);
    }
    buffer += decoder.decode();
    if (buffer.trim()) consume(buffer);
    if (!completed || !text.trim())
      throw new Error("Casetjenesten returnerte ikke et fullført svar. Prøv igjen.");
    return JSON.parse(text);
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
}: {
  instructions: string;
  input: string;
  schemaName: string;
  schema: JsonSchema;
  effort?: "low" | "medium" | "high";
}): Promise<unknown> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Casetjenesten mangler LOVABLE_API_KEY på serveren.");
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(240000),
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions,
        input,
        stream: true,
        reasoning: { effort },
        text: { format: { type: "json_schema", name: schemaName, strict: true, schema } },
      }),
    });
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      if (response.status === 402)
        throw new Error("AI-kreditten er brukt opp. Fyll på for å lage flere caser.");
      if (response.status === 429)
        throw new Error("For mange forespørsler akkurat nå. Prøv igjen om litt.");
      throw new Error(`Casetjenesten svarte ikke (${response.status}). Prøv igjen.`);
    }
    return await readResponseJson(response.body);
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError"))
      throw new Error("Casetjenesten brukte for lang tid. Prøv igjen.");
    throw error;
  }
}
