// Server-only. Calls the Lovable AI Gateway Responses API with streaming and
// returns the completed text. Streaming keeps bytes flowing during long
// reasoning runs; nothing is rendered progressively from this helper.

type JsonSchema = Record<string, unknown>;

export async function generateJson({
  instructions,
  input,
  schemaName,
  schema,
  effort = "low",
}: {
  instructions: string;
  input: string;
  schemaName: string;
  schema: JsonSchema;
  effort?: "low" | "medium" | "high";
}): Promise<unknown> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Mangler LOVABLE_API_KEY");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
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
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    if (response.status === 402)
      throw new Error("AI-kreditten er brukt opp. Fyll på for å lage flere caser.");
    if (response.status === 429)
      throw new Error("For mange forespørsler akkurat nå. Prøv igjen om litt.");
    throw new Error(`Casetjenesten svarte ikke (${response.status}). ${detail.slice(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let event: { type?: string; delta?: string; response?: { output_text?: string } };
      try {
        event = JSON.parse(payload);
      } catch {
        continue;
      }
      if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
        text += event.delta;
      } else if (event.type === "response.completed" && event.response?.output_text) {
        text = event.response.output_text;
      }
    }
  }

  if (!text.trim()) throw new Error("Casetjenesten returnerte ingen tekst.");
  return JSON.parse(text);
}
