import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "../integrations/supabase/types";
import { actionSchema, type GenerateOptions } from "./case-api-contract";
import {
  createBackgroundGenerator,
  digest,
  PendingModel,
  type ModelStep,
} from "./openai-background.server";
import { AiProviderError, providerErrorFromResponse } from "./ai-gateway.server";
import { generateValidatedCase } from "./case-generation.server";
import { generateFeedback, generateModelAnswer } from "./case-feedback.server";
import {
  loadCaseHistory,
  loadOwnedAssessment,
  saveCaseWithAssessment,
} from "./case-persistence.server";
import { drawVariety, type VarietyDraw } from "./case-variety";
import { publicDefinition } from "./generated-case";
import { allQuestions, type CaseDefinition } from "./case-model";
import { sourcesFor } from "./case-sources.server";
import { generationProgress } from "./case-generation-progress";

type Action = z.infer<typeof actionSchema>;
type JobAction = Extract<Action, { action: "generate" | "assess" | "model" }>;
type Job = {
  id: string;
  user_id: string;
  kind: JobAction["action"];
  case_id: string;
  status: "pending" | "completed" | "failed";
  request_hash: string;
  context: { action: JobAction; draw?: VarietyDraw; recent?: CaseDefinition[] };
  steps: ModelStep[];
  result: unknown;
  error: string | null;
  created_at: string;
  expires_at: string;
  generation_options?: GenerateOptions | null;
  retry_count?: number;
  needs_next_request?: boolean;
};
type Environment = {
  supabaseUrl: string;
  publicKey: string;
  serviceKey: string;
  openaiKey: string;
  workerSecret?: string;
  generationServiceTier?: string;
};
class ApiFault extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });
const pending = (job: Job, needsNextRequest = false) =>
  json({
    status: "pending",
    jobId: job.id,
    retryAfterMs: 2500,
    ...(job.kind === "generate"
      ? {
          progress: generationProgress(job.steps, needsNextRequest || job.needs_next_request),
          createdAt: job.created_at,
          format: generationOptions(job)?.format,
          options: generationOptions(job),
        }
      : {}),
  });
function generationOptions(job: Job): GenerateOptions | undefined {
  return (
    job.generation_options ??
    (job.context.action?.action === "generate" ? job.context.action.data : undefined)
  );
}
function publicGenerationJob(job: Job) {
  const expired = job.status === "pending" && Date.parse(job.expires_at) <= Date.now();
  const status = expired ? "failed" : job.status;
  const definition =
    job.status === "completed"
      ? publicDefinition((job.result as { definition: unknown }).definition)
      : undefined;
  const options = generationOptions(job);
  return {
    id: job.id,
    status,
    format: options?.format ?? (definition && definition.parts.length > 1 ? "long" : "quick"),
    createdAt: job.created_at,
    ...(options ? { options } : {}),
    ...(definition ? { definition } : {}),
    ...(status === "pending"
      ? { progress: generationProgress(job.steps, job.needs_next_request) }
      : {}),
    ...(status === "completed" ? { progress: { phase: "completed" } } : {}),
    ...(status === "failed"
      ? {
          error: expired
            ? "Oppgaven er utløpt. Prøv igjen."
            : (job.error ?? "Oppgaven kunne ikke fullføres."),
        }
      : {}),
  };
}
function safeError(error: unknown): string {
  if (error instanceof ApiFault || error instanceof AiProviderError) return error.message;
  if (
    error instanceof Error &&
    !(error instanceof z.ZodError) &&
    /^(Casen |Fagkontrollen |Modellbesvarelsen |Besvarelsen |Vurderingsgrunnlaget |Kunne ikke |Fant ikke |Denne eldre casen )/.test(
      error.message,
    )
  )
    return error.message.slice(0, 350);
  return "Casetjenesten kunne ikke fullføre. Prøv igjen.";
}
function database(url: string, key: string, token?: string) {
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      fetch(input, init) {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers, signal: AbortSignal.timeout(15000) });
      },
    },
  });
}
async function readInput(request: Request): Promise<Action> {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiFault(400, "Ugyldig forespørsel.");
  const decoder = new TextDecoder();
  let text = "",
    bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 16500000) throw new ApiFault(413, "Forespørselen er for stor.");
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    return actionSchema.parse(JSON.parse(text));
  } catch (error) {
    if (error instanceof ApiFault) throw error;
    throw new ApiFault(400, "Ugyldig forespørsel.");
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** Advances one persisted, authenticated job under an atomic lease. Each call
 * performs at most one provider request; a later worker resumes its checkpoint. */
async function advanceCaseJob(
  env: Environment,
  job: Job,
  authenticated: SupabaseClient<Database>,
  admin: SupabaseClient<Database>,
): Promise<Response> {
  const jobs = admin as unknown as SupabaseClient;
  const jobId = job.id;
  const userId = job.user_id;
  const lease = crypto.randomUUID();
  const { data: claimed, error: claimError } = await jobs.rpc("claim_case_ai_job", {
    p_id: jobId,
    p_user_id: userId,
    p_lease: lease,
  });
  if (claimError) throw new ApiFault(503, "Kunne ikke fortsette oppgaven.");
  if (!claimed?.length) return pending(job);
  const locked = claimed[0] as Job;
  const save = async (changes: Record<string, unknown>) => {
    const { data, error } = await jobs
      .from("case_ai_jobs")
      .update(changes)
      .eq("id", jobId)
      .eq("user_id", userId)
      .eq("lease_token", lease)
      .select("id")
      .maybeSingle();
    if (error || !data)
      throw new ApiFault(503, "Kunne ikke lagre fremdriften. Prøv igjen med de samme valgene.");
  };
  try {
    const generate = createBackgroundGenerator({
      apiKey: env.openaiKey,
      steps: locked.steps,
      save: () => save({ steps: locked.steps, needs_next_request: false }),
      serviceTier:
        locked.kind === "generate"
          ? env.generationServiceTier === "default" || env.generationServiceTier === "fast"
            ? env.generationServiceTier
            : "ultrafast"
          : "default",
    });
    const input = locked.context.action;
    let result: unknown;
    if (input.action === "generate") {
      if (!locked.context.draw || !locked.context.recent) throw new AiProviderError("unavailable");
      const generated = await generateValidatedCase({
        id: `gen-${jobId}`,
        draw: locked.context.draw,
        stages: input.data.stages,
        recent: locked.context.recent,
        generate,
      });
      // If the final checkpoint failed after the atomic case save, reuse it.
      const { data: saved, error: readError } = await authenticated
        .from("generated_cases")
        .select("id")
        .eq("id", jobId)
        .eq("user_id", userId)
        .maybeSingle();
      if (readError) throw new ApiFault(503, "Kunne ikke bekrefte lagringen.");
      if (!saved)
        await saveCaseWithAssessment(admin, {
          id: jobId,
          userId,
          format: input.data.format,
          definition: generated.definition,
          assessment: generated.assessment,
          draw: locked.context.draw,
        });
      result = { definition: generated.definition };
    } else {
      const { definition, assessment } = await loadOwnedAssessment(
        authenticated,
        admin,
        userId,
        input.data.id,
      );
      if (input.action === "assess") {
        const ids = new Set(allQuestions(definition).map((q) => q.id));
        if (Object.keys(input.data.answers).some((id) => !ids.has(id)))
          throw new ApiFault(400, "Besvarelsen inneholder ukjente oppgaver.");
        result = {
          feedback: await generateFeedback(definition, assessment, input.data.answers, generate, {
            solutionViewed: input.data.solutionViewed,
          }),
          sources: sourcesFor(assessment.sourceIds),
        };
      } else
        result = {
          modelAnswer: await generateModelAnswer(definition, assessment, generate),
          sources: sourcesFor(assessment.sourceIds),
        };
    }
    await save({
      status: "completed",
      result,
      completed_at: new Date().toISOString(),
      metrics:
        locked.kind === "generate"
          ? {
              durationMs: Date.now() - Date.parse(locked.created_at),
              providerSteps: locked.steps.length,
              serviceTiers: locked.steps.map((step) => step.serviceTier ?? null),
            }
          : null,
      context: {},
      steps: [],
      lease_token: null,
      lease_until: null,
    });
    return json({
      status: "completed",
      result,
      ...(locked.kind === "generate" ? { progress: { phase: "completed" } } : {}),
    });
  } catch (error) {
    if (error instanceof PendingModel) {
      await save({
        lease_token: null,
        lease_until: null,
        next_attempt_at: new Date(Date.now() + 2000).toISOString(),
        retry_count: 0,
        needs_next_request: error.needsNextRequest,
      });
      return pending(locked, error.needsNextRequest);
    }
    if (error instanceof ApiFault && error.status === 503) {
      // A transient database failure must not erase a completed model response
      // or turn an already saved case into a failed job. Resume its checkpoint;
      // if releasing the lease also fails, the bounded lease expires on its own.
      await save({
        lease_token: null,
        lease_until: null,
        next_attempt_at: new Date(Date.now() + 2500).toISOString(),
      }).catch(() => undefined);
      throw error;
    }
    // A known provider response can be polled again without buying another case.
    // An ambiguous submission has no response ID and deliberately fails closed.
    const canRetry =
      error instanceof AiProviderError &&
      ["unavailable", "timeout", "rate-limited"].includes(error.code) &&
      locked.steps.some((step) => step.responseId && !Object.hasOwn(step, "output")) &&
      (locked.retry_count ?? 0) < 3;
    if (canRetry) {
      const retries = (locked.retry_count ?? 0) + 1;
      await save({
        lease_token: null,
        lease_until: null,
        retry_count: retries,
        next_attempt_at: new Date(Date.now() + 2500 * retries).toISOString(),
      });
      return pending(locked);
    }
    const message = safeError(error);
    await save({
      status: "failed",
      error: message,
      context: {},
      steps: [],
      lease_token: null,
      lease_until: null,
    });
    return json({ error: message }, error instanceof ApiFault ? error.status : 422);
  }
}

export function createCaseHandler(environment: () => Environment) {
  return async (request: Request): Promise<Response> => {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "Metoden støttes ikke." }, 405);
    try {
      const token = request.headers.get("Authorization")?.match(/^Bearer ([^\s]+)$/)?.[1];
      if (!token || token.split(".").length !== 3)
        throw new ApiFault(401, "Logg inn for å bruke casetjenesten.");
      const env = environment();
      if (!env.supabaseUrl || !env.publicKey || !env.serviceKey)
        throw new ApiFault(503, "Casetjenesten er ikke konfigurert.");
      const authenticated = database(env.supabaseUrl, env.publicKey, token);
      const { data: auth, error: authError } = await authenticated.auth.getUser(token);
      if (authError || !auth.user)
        throw new ApiFault(401, "Innloggingen er utløpt. Logg inn igjen.");
      const userId = auth.user.id;
      const action = await readInput(request);
      const admin = database(env.supabaseUrl, env.serviceKey);
      // The new private jobs table is intentionally absent from the generated
      // browser database types. Only this authenticated server uses it.
      const jobs = admin as unknown as SupabaseClient;
      if (action.action === "list") {
        const { data, error } = await authenticated
          .from("generated_cases")
          .select("id, title, format, definition, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw new ApiFault(503, "Kunne ikke hente casene dine.");
        return json({
          status: "completed",
          result: (data ?? []).map((row) => ({
            id: row.id,
            title: row.title,
            format: row.format,
            createdAt: row.created_at,
            definition: publicDefinition(row.definition),
          })),
        });
      }
      if (action.action === "delete") {
        const { error } = await authenticated
          .from("generated_cases")
          .delete()
          .eq("id", action.data.id)
          .eq("user_id", userId);
        if (error) throw new ApiFault(503, "Kunne ikke slette casen.");
        const { error: cleanupError } = await jobs
          .from("case_ai_jobs")
          .delete()
          .eq("case_id", action.data.id)
          .eq("user_id", userId);
        if (cleanupError)
          throw new ApiFault(
            503,
            "Casen er slettet, men oppgavedata kunne ikke ryddes. Prøv slettingen igjen.",
          );
        return json({ status: "completed", result: { ok: true } });
      }
      if (action.action === "generation-status") {
        const { data: recentJob, error } = await jobs
          .from("case_ai_jobs")
          .select("*")
          .eq("user_id", userId)
          .eq("kind", "generate")
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw new ApiFault(503, "Kunne ikke hente fremdriften.");
        return json({
          status: "completed",
          result: { job: recentJob ? publicGenerationJob(recentJob as Job) : null },
        });
      }
      if (!env.openaiKey && action.action !== "poll") throw new AiProviderError("authentication");
      if (action.action === "transcribe") {
        const bytes = Uint8Array.from(atob(action.data.audio), (c) => c.charCodeAt(0));
        if (!bytes.length || bytes.length > 12000000)
          throw new ApiFault(413, "Lydopptaket er for stort.");
        const mime = action.data.mimeType.split(";")[0]!;
        const extension = mime.split("/")[1] === "mpeg" ? "mp3" : mime.split("/")[1];
        const form = new FormData();
        form.append("file", new Blob([bytes], { type: mime }), `dictation.${extension}`);
        form.append("model", "gpt-transcribe");
        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.openaiKey}` },
          body: form,
          redirect: "error",
          signal: AbortSignal.timeout(60000),
        });
        if (!response.ok) throw await providerErrorFromResponse(response);
        const result = (await response.json()) as { text?: unknown };
        if (typeof result.text !== "string" || result.text.length > 80000)
          throw new ApiFault(502, "Dikteringen kunne ikke fullføres.");
        return json({ status: "completed", result: { text: result.text } });
      }

      let jobId = action.action === "poll" ? action.jobId : action.requestId;
      if (action.action !== "poll") {
        const requestHash = await digest({ kind: action.action, data: action.data });
        const { data: existing, error: lookupError } = await jobs
          .from("case_ai_jobs")
          .select("id, user_id, request_hash")
          .eq("id", jobId)
          .eq("user_id", userId)
          .maybeSingle();
        if (lookupError) throw new ApiFault(503, "Kunne ikke starte oppgaven.");
        if (existing && existing.request_hash !== requestHash)
          throw new ApiFault(409, "Oppgaven samsvarer ikke med den opprinnelige forespørselen.");
        if (!existing) {
          const now = new Date().toISOString();
          const { error: expireError } = await jobs
            .from("case_ai_jobs")
            .update({
              status: "failed",
              error: "Oppgaven er utløpt. Prøv igjen.",
              context: {},
              steps: [],
            })
            .eq("user_id", userId)
            .eq("status", "pending")
            .lt("expires_at", now);
          if (expireError) throw new ApiFault(503, "Kunne ikke starte oppgaven.");
          const { data: active, error: activeError } = await jobs
            .from("case_ai_jobs")
            .select("id, request_hash")
            .eq("user_id", userId)
            .eq("status", "pending")
            .maybeSingle();
          if (activeError) throw new ApiFault(503, "Kunne ikke starte oppgaven.");
          if (active) {
            if (active.request_hash !== requestHash)
              throw new ApiFault(
                409,
                "En tidligere oppgave pågår. Bruk de samme valgene for å fortsette den.",
              );
            jobId = active.id;
          } else {
            const context: Job["context"] = { action };
            if (action.action === "generate") {
              const { history, recent } = await loadCaseHistory(authenticated, admin, userId);
              context.draw = drawVariety(history, action.data);
              context.recent = recent;
            } else {
              await loadOwnedAssessment(authenticated, admin, userId, action.data.id);
            }
            const { error: insertError } = await jobs.from("case_ai_jobs").insert({
              id: jobId,
              user_id: userId,
              kind: action.action,
              case_id: action.action === "generate" ? jobId : action.data.id,
              request_hash: requestHash,
              generation_options: action.action === "generate" ? action.data : null,
              context,
            });
            if (insertError)
              throw new ApiFault(
                409,
                "En oppgave ble nettopp startet. Prøv igjen med de samme valgene.",
              );
          }
        }
      }
      const { data: found, error: jobError } = await jobs
        .from("case_ai_jobs")
        .select("*")
        .eq("id", jobId)
        .eq("user_id", userId)
        .maybeSingle();
      if (jobError || !found) throw new ApiFault(404, "Fant ikke en oppgave som tilhører deg.");
      const job = found as Job;
      if (job.status === "completed")
        return json({
          status: "completed",
          jobId: job.id,
          result:
            job.kind === "generate"
              ? { definition: publicGenerationJob(job).definition }
              : job.result,
          ...(job.kind === "generate" ? { progress: { phase: "completed" } } : {}),
        });
      if (job.status === "failed")
        return json({ error: job.error ?? "Oppgaven kunne ikke fullføres." }, 422);
      if (Date.parse(job.expires_at) <= Date.now())
        throw new ApiFault(410, "Oppgaven er utløpt. Prøv igjen.");
      // Generation runs on the server scheduler. Viewing its status never
      // starts provider work, so it finishes even when every browser is closed.
      if (job.kind === "generate") return pending(job);
      return await advanceCaseJob(env, job, authenticated, admin);
    } catch (error) {
      return json({ error: safeError(error) }, error instanceof ApiFault ? error.status : 503);
    }
  };
}

/** Internal scheduler endpoint. It accepts no job, owner, prompt or credentials
 * from its body: only jobs already accepted by the authenticated API can run. */
export function createCaseWorker(environment: () => Environment) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return json({ error: "Metoden støttes ikke." }, 405);
    const supplied = request.headers.get("x-case-worker-secret");
    if (!supplied || supplied.length < 32 || supplied.length > 256)
      return json({ error: "Ikke autorisert." }, 401);
    try {
      const env = environment();
      if (!env.workerSecret || env.workerSecret.length < 32)
        throw new ApiFault(503, "Arbeidstjenesten er ikke konfigurert.");
      // Compare fixed-length digests; do not leak where a secret differs.
      const [actual, expected] = await Promise.all([digest(supplied), digest(env.workerSecret)]);
      let difference = 0;
      for (let index = 0; index < expected.length; index++)
        difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
      if (difference) return json({ error: "Ikke autorisert." }, 401);
      if (!env.supabaseUrl || !env.serviceKey || !env.openaiKey)
        throw new ApiFault(503, "Arbeidstjenesten er ikke konfigurert.");
      const admin = database(env.supabaseUrl, env.serviceKey);
      const jobs = admin as unknown as SupabaseClient;
      const now = new Date().toISOString();
      const { error: expireError } = await jobs
        .from("case_ai_jobs")
        .update({
          status: "failed",
          error: "Oppgaven er utløpt. Prøv igjen.",
          context: {},
          steps: [],
          lease_token: null,
          lease_until: null,
        })
        .eq("status", "pending")
        .lte("expires_at", now);
      if (expireError) throw new ApiFault(503, "Kunne ikke rydde utløpte oppgaver.");
      const { data, error } = await jobs
        .from("case_ai_jobs")
        .select("*")
        .eq("status", "pending")
        .gt("expires_at", now)
        .lte("next_attempt_at", now)
        .or(`lease_until.is.null,lease_until.lt.${now}`)
        .order("next_attempt_at", { ascending: true })
        .limit(8);
      if (error) throw new ApiFault(503, "Kunne ikke hente oppgavene.");
      // Account identity comes from the private job row, never a caller's input.
      // Persistence helpers still require explicit owner predicates on every read.
      const results = await Promise.allSettled(
        (data ?? []).map((row) => advanceCaseJob(env, row as Job, admin, admin)),
      );
      return json({
        processed: results.length,
        errors: results.filter((result) => result.status === "rejected" || !result.value.ok).length,
      });
    } catch (error) {
      return json({ error: safeError(error) }, error instanceof ApiFault ? error.status : 503);
    }
  };
}
