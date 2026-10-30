import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCaseHandler, createCaseWorker } from "../src/lib/case-edge.server";
import { draw, generatedFixture } from "./generator-fixtures";

const userId = "00000000-0000-4000-8000-000000000001";
const jobId = "00000000-0000-4000-8000-000000000010";
const secret = "worker-secret-only-for-tests-1234567890";
const env = {
  supabaseUrl: "https://example.supabase.co",
  publicKey: "test-public",
  serviceKey: "test-service",
  openaiKey: "test-openai",
  workerSecret: secret,
};
const options = {
  format: "long",
  stages: 3,
  topic: "geriatrics",
  startSetting: "legevakt",
  difficulty: "complex",
};
const workerRequest = (key = secret) =>
  new Request("https://example.test/case-worker", {
    method: "POST",
    headers: { "x-case-worker-secret": key },
    body: "{}",
  });
const userRequest = (action: unknown) =>
  new Request("https://example.test/case-api", {
    method: "POST",
    headers: { Authorization: "Bearer a.b.c" },
    body: JSON.stringify(action),
  });
function fixtureJob() {
  return {
    id: jobId,
    user_id: userId,
    case_id: jobId,
    kind: "generate",
    status: "pending",
    context: { action: { action: "generate", requestId: jobId, data: options }, draw, recent: [] },
    steps: [] as Record<string, unknown>[],
    result: null as unknown,
    generation_options: options,
    request_hash: "test",
    error: null as string | null,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 300000).toISOString(),
    next_attempt_at: new Date(0).toISOString(),
    retry_count: 0,
    lease_token: null as string | null,
    lease_until: null as string | null,
    metrics: null as null | { durationMs: number; providerSteps: number; serviceTiers: unknown[] },
  };
}
function mockDatabase(
  job: ReturnType<typeof fixtureJob>,
  provider: (init?: RequestInit) => Response | Promise<Response>,
  beforePatch?: (body: Record<string, unknown>) => Response | undefined,
) {
  const requests: { url: URL; method: string; body?: Record<string, unknown> }[] = [];
  let saves = 0;
  const transport = (async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ url, method, body });
    if (url.host === "api.openai.com") return provider(init);
    if (url.pathname === "/auth/v1/user") return Response.json({ id: userId });
    if (url.pathname === "/rest/v1/rpc/claim_case_ai_job") {
      assert.equal(body.p_user_id, userId);
      assert.equal(body.p_id, jobId);
      if (job.status !== "pending" || job.lease_token) return Response.json([]);
      job.lease_token = body.p_lease;
      return Response.json([job]);
    }
    if (url.pathname === "/rest/v1/rpc/create_case_with_assessment") {
      assert.equal(body.p_user_id, userId);
      assert.equal(body.p_id, jobId);
      assert.ok(body.p_assessment.generated);
      assert.doesNotMatch(JSON.stringify(body.p_definition), /diagnosisFamily|rubric|dossier/);
      saves++;
      return Response.json(null);
    }
    if (url.pathname === "/rest/v1/generated_cases") {
      assert.equal(url.searchParams.get("user_id"), `eq.${userId}`);
      return Response.json(saves ? [{ id: jobId }] : []);
    }
    if (url.pathname === "/rest/v1/case_ai_jobs") {
      if (method === "PATCH") {
        const failure = beforePatch?.(body);
        if (failure) return failure;
        const expired = url.searchParams.has("expires_at");
        if (expired) {
          if (Date.parse(job.expires_at) <= Date.now()) Object.assign(job, body);
          return new Response(null, { status: 204 });
        }
        assert.equal(url.searchParams.get("user_id"), `eq.${userId}`);
        if (url.searchParams.get("lease_token") !== `eq.${job.lease_token}`)
          return Response.json([]);
        Object.assign(job, body);
        return Response.json([{ id: jobId }]);
      }
      if (url.searchParams.has("user_id")) {
        assert.equal(url.searchParams.get("user_id"), `eq.${userId}`);
        return Response.json([job]);
      }
      assert.equal(url.searchParams.get("status"), "eq.pending");
      assert.ok(url.searchParams.get("next_attempt_at")?.startsWith("lte."));
      assert.equal(url.searchParams.get("order"), "next_attempt_at.asc");
      return Response.json(
        job.status === "pending" && !job.lease_token && Date.parse(job.expires_at) > Date.now()
          ? [job]
          : [],
      );
    }
    throw new Error(`Unexpected request ${url.pathname}`);
  }) as typeof fetch;
  return { transport, requests, saved: () => saves };
}

describe("Durable server generation", () => {
  it("rejects unauthenticated scheduler work before any database or provider call", async () => {
    const original = globalThis.fetch;
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      throw new Error("unexpected");
    }) as typeof fetch;
    try {
      const worker = createCaseWorker(() => env);
      for (const key of ["", "not-a-secret", "a-different-valid-length-secret-1234567890"])
        assert.equal((await worker(workerRequest(key))).status, 401);
      assert.equal((await worker(new Request("https://example.test"))).status, 405);
      assert.equal(called, false);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("completes and saves a case from worker ticks with no browser polling, then recovers it on another device", async () => {
    const original = globalThis.fetch;
    const job = fixtureJob();
    let providerCalls = 0;
    const db = mockDatabase(job, (init) => {
      providerCalls++;
      assert.equal(init?.method, providerCalls === 1 ? "POST" : "GET");
      if (providerCalls === 1) {
        assert.equal(JSON.parse(String(init?.body)).service_tier, "ultrafast");
        return Response.json({ id: "resp_durable", status: "queued" });
      }
      return Response.json({
        id: "resp_durable",
        status: "completed",
        model: "gpt-6-astra",
        service_tier: "ultrafast",
        output_text: JSON.stringify(generatedFixture()),
      });
    });
    globalThis.fetch = db.transport;
    try {
      const worker = createCaseWorker(() => env);
      assert.equal((await worker(workerRequest())).status, 200);
      assert.equal(job.status, "pending");
      assert.equal(job.steps[0]!.responseId, "resp_durable");
      assert.equal(db.saved(), 0);
      assert.equal((await worker(workerRequest())).status, 200);
      assert.equal(job.status, "completed");
      assert.equal(db.saved(), 1);
      assert.equal(providerCalls, 2);
      assert.deepEqual(job.context, {});
      assert.deepEqual(job.steps, []);
      assert.equal(job.metrics?.providerSteps, 1);
      assert.deepEqual(job.metrics?.serviceTiers, ["ultrafast"]);
      assert.ok((job.metrics?.durationMs ?? -1) >= 0);
      assert.deepEqual(await (await worker(workerRequest())).json(), { processed: 0, errors: 0 });
      assert.equal(providerCalls, 2);
      // New device knows neither a request ID nor an earlier browser state.
      const recovered = await createCaseHandler(() => ({ ...env, openaiKey: "" }))(
        userRequest({ action: "generation-status" }),
      );
      assert.equal(recovered.status, 200);
      const body = await recovered.json();
      assert.equal(body.result.job.id, jobId);
      assert.equal(body.result.job.status, "completed");
      assert.equal(body.result.job.format, "long");
      assert.equal(body.result.job.definition.parts.length, 3);
      assert.deepEqual(body.result.job.options, options);
      assert.doesNotMatch(
        JSON.stringify(body),
        /test-service|resp_durable|diagnosisFamily|rubric|dossier|providerSteps/,
      );
    } finally {
      globalThis.fetch = original;
    }
  });

  it("status and poll are read-only, owner scoped and reveal no checkpoints", async () => {
    const original = globalThis.fetch;
    const job = fixtureJob();
    job.steps.push({ hash: "private-hash", responseId: "resp_private", status: "in_progress" });
    const db = mockDatabase(job, () => {
      throw new Error("browser must not contact provider");
    });
    globalThis.fetch = db.transport;
    try {
      const api = createCaseHandler(() => ({ ...env, openaiKey: "" }));
      for (const action of [{ action: "poll", jobId }, { action: "generation-status" }]) {
        const response = await api(userRequest(action));
        assert.equal(response.status, 200);
        const body = await response.json();
        assert.doesNotMatch(
          JSON.stringify(body),
          /private-hash|resp_private|diagnosisFamily|dossier|request_hash/,
        );
      }
      assert.ok(db.requests.every((request) => request.method === "GET"));
    } finally {
      globalThis.fetch = original;
    }
  });

  it("recovers the repair milestone and keeps invalid drafts private until the repaired case passes", async () => {
    const original = globalThis.fetch;
    const job = fixtureJob();
    let calls = 0;
    const db = mockDatabase(job, () => {
      const draft = generatedFixture();
      if (++calls === 1) draft.stages[0]!.vitals = [];
      return Response.json({
        id: `resp_repair${calls}`,
        status: "completed",
        model: "gpt-6-astra",
        output_text: JSON.stringify(draft),
      });
    });
    globalThis.fetch = db.transport;
    try {
      const worker = createCaseWorker(() => env);
      assert.equal((await worker(workerRequest())).status, 200);
      assert.equal(job.status, "pending");
      assert.equal(db.saved(), 0);
      const status = await createCaseHandler(() => env)(
        userRequest({ action: "generation-status" }),
      );
      const recovered = await status.json();
      assert.equal(recovered.result.job.progress.phase, "repairing");
      assert.equal(recovered.result.job.definition, undefined);
      assert.doesNotMatch(JSON.stringify(recovered), /diagnosisFamily|rubric|dossier/);
      assert.equal((await worker(workerRequest())).status, 200);
      assert.equal(job.status, "completed");
      assert.equal(db.saved(), 1);
      assert.equal(calls, 2);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("expires abandoned jobs even when no student returns", async () => {
    const original = globalThis.fetch;
    const job = fixtureJob();
    job.expires_at = new Date(0).toISOString();
    const db = mockDatabase(job, () => {
      throw new Error("expired work must not generate");
    });
    globalThis.fetch = db.transport;
    try {
      const result = await createCaseWorker(() => env)(workerRequest());
      assert.equal(result.status, 200);
      assert.equal(job.status, "failed");
      assert.deepEqual(job.context, {});
      assert.deepEqual(job.steps, []);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("retries a transient provider poll without submitting another model request", async () => {
    const original = globalThis.fetch;
    const job = fixtureJob();
    let calls = 0;
    const db = mockDatabase(job, (init) => {
      calls++;
      if (calls === 1) {
        assert.equal(init?.method, "POST");
        return Response.json({ id: "resp_retry", status: "queued" });
      }
      assert.equal(init?.method, "GET");
      if (calls === 2)
        return Response.json({ error: { message: "private diagnostic" } }, { status: 502 });
      return Response.json({
        id: "resp_retry",
        status: "completed",
        model: "gpt-6-astra",
        output_text: JSON.stringify(generatedFixture()),
      });
    });
    globalThis.fetch = db.transport;
    try {
      const worker = createCaseWorker(() => env);
      await worker(workerRequest());
      await worker(workerRequest());
      assert.equal(job.status, "pending");
      assert.equal(job.retry_count, 1);
      assert.equal(job.error, null);
      await worker(workerRequest());
      assert.equal(job.status, "completed");
      assert.equal(db.saved(), 1);
      assert.equal(calls, 3);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("fences overlapping worker invocations so one job buys only one response", async () => {
    const original = globalThis.fetch;
    const job = fixtureJob();
    let started!: () => void;
    const providerStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    let complete!: () => void;
    const finishProvider = new Promise<void>((resolve) => {
      complete = resolve;
    });
    let calls = 0;
    const db = mockDatabase(job, async () => {
      calls++;
      started();
      await finishProvider;
      return Response.json({ id: "resp_single", status: "queued" });
    });
    globalThis.fetch = db.transport;
    try {
      const worker = createCaseWorker(() => env);
      const first = worker(workerRequest());
      await providerStarted;
      const second = await worker(workerRequest());
      assert.deepEqual(await second.json(), { processed: 0, errors: 0 });
      complete();
      assert.equal((await first).status, 200);
      assert.equal(calls, 1);
    } finally {
      complete();
      globalThis.fetch = original;
    }
  });

  it("recovers a failed final checkpoint after the atomic case save without a second purchase or save", async () => {
    const original = globalThis.fetch;
    const job = fixtureJob();
    let calls = 0;
    let failOnce = true;
    const db = mockDatabase(
      job,
      () => {
        calls++;
        return Response.json({
          id: "resp_saved",
          status: "completed",
          model: "gpt-6-astra",
          output_text: JSON.stringify(generatedFixture()),
        });
      },
      (body) => {
        if (body.status !== "completed" || !failOnce) return;
        failOnce = false;
        return Response.json({ message: "private checkpoint failure" }, { status: 400 });
      },
    );
    globalThis.fetch = db.transport;
    try {
      const worker = createCaseWorker(() => env);
      const first = await worker(workerRequest());
      assert.deepEqual(await first.json(), { processed: 1, errors: 1 });
      assert.equal(job.status, "pending");
      assert.equal(db.saved(), 1);
      assert.ok(job.steps[0]!.output);
      await worker(workerRequest());
      assert.equal(job.status, "completed");
      assert.equal(db.saved(), 1);
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = original;
    }
  });
});
