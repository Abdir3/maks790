import { supabase } from "../integrations/supabase/client";
import { readGenerationProgress, type GenerationProgress } from "./case-generation-progress";

export type CaseApiEnvelope<T = unknown> = {
  status?: string;
  result?: T;
  jobId?: string;
  retryAfterMs?: number;
  error?: string;
  progress?: unknown;
  createdAt?: string;
  format?: "quick" | "long";
};
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Acknowledges a durable server job without keeping the page alive until it ends.
export async function requestCaseApi<T>(
  payload: Record<string, unknown>,
  expectedOwner: string,
): Promise<CaseApiEnvelope<T>> {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const publicKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !publicKey) throw new Error("Casetjenesten er ikke konfigurert.");
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Logg inn for å bruke casetjenesten.");
  if (data.session.user.id !== expectedOwner)
    throw new Error("Innloggingen er endret. Logg inn igjen før du fortsetter.");
  let response: Response;
  try {
    response = await fetch(`${url}/functions/v1/case-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: publicKey,
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify(payload),
      // Small start payloads may finish sending when the user closes the tab.
      keepalive: payload["action"] === "generate",
      signal: AbortSignal.timeout(50000),
    });
  } catch {
    throw new Error(
      "Kunne ikke bekrefte forbindelsen. Sjekker om casen er startet på kontoen din.",
    );
  }
  const body = (await response.json().catch(() => null)) as CaseApiEnvelope<T> | null;
  if (!body || !response.ok || body.error)
    throw new Error(body?.error ?? "Casetjenesten svarte ikke. Prøv igjen.");
  return body;
}

export async function callCaseApi<T>(
  initial: Record<string, unknown>,
  onProgress?: (progress: GenerationProgress) => void,
): Promise<T> {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const publicKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !publicKey) throw new Error("Casetjenesten er ikke konfigurert.");
  const first = await supabase.auth.getSession();
  const owner = first.data.session?.user.id;
  if (!owner) throw new Error("Logg inn for å bruke casetjenesten.");
  const deadline = Date.now() + 20 * 60_000;
  let payload = initial;
  let failures = 0;
  while (Date.now() < deadline) {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session || data.session.user.id !== owner)
      throw new Error("Innloggingen er endret. Logg inn igjen før du fortsetter.");
    let response: Response;
    try {
      response = await fetch(`${url}/functions/v1/case-api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: publicKey,
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(initial["action"] === "transcribe" ? 90000 : 50000),
      });
    } catch {
      if (++failures > 3)
        throw new Error("Forbindelsen ble brutt. Prøv igjen med de samme valgene for å fortsette.");
      await wait(1500 * failures);
      continue;
    }
    failures = 0;
    let body: CaseApiEnvelope;
    try {
      body = await response.json();
    } catch {
      throw new Error("Casetjenesten svarte ikke. Prøv igjen med de samme valgene.");
    }
    if (!response.ok || body.error)
      throw new Error(
        body.error ??
          (response.status === 401 ? "Logg inn igjen." : "Casetjenesten svarte ikke. Prøv igjen."),
      );
    const progress = readGenerationProgress(body.progress);
    if (progress) onProgress?.(progress);
    if (body.status === "completed") return body.result as T;
    if (body.status !== "pending" || !body.jobId)
      throw new Error("Casetjenesten returnerte et ugyldig svar.");
    payload = { action: "poll", jobId: body.jobId };
    await wait(Math.max(1500, Math.min(body.retryAfterMs ?? 2500, 5000)));
  }
  throw new Error("Oppgaven tar lang tid. Prøv igjen med de samme valgene for å fortsette.");
}
