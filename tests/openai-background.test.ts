import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createBackgroundGenerator,
  digest,
  PendingModel,
  type ModelStep,
} from "../src/lib/openai-background.server";
import { AiProviderError } from "../src/lib/ai-gateway.server";
import { createCaseHandler } from "../src/lib/case-edge.server";
import { actionSchema } from "../src/lib/case-api-contract";

const args = {
  instructions: "Return JSON",
  input: "Test",
  schemaName: "test",
  schema: {
    type: "object",
    properties: { ok: { type: "boolean" } },
    required: ["ok"],
    additionalProperties: false,
  },
};
const response = (status: string, output?: string) =>
  Response.json({
    id: "resp_test",
    model: "gpt-6.1-terra",
    status,
    ...(output ? { output: [{ content: [{ type: "output_text", text: output }] }] } : {}),
  });

describe("Resumable Terra responses", () => {
  it("retains usage and stops an output-limit failure without accepting partial JSON", async () => {
    const steps: ModelStep[] = [];
    const generate = createBackgroundGenerator({
      apiKey: "test",
      steps,
      save: async () => {},
      maxOutputTokens: 18000,
      transport: (async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        assert.equal(body.text.verbosity, "low");
        assert.equal(body.max_output_tokens, 18000);
        return Response.json({
          id: "resp_test",
          model: "gpt-6.1-terra",
          status: "incomplete",
          incomplete_details: { reason: "max_output_tokens" },
          usage: { input_tokens: 1000, output_tokens: 18000 },
          output_text: '{"partial":',
        });
      }) as typeof fetch,
    });
    await assert.rejects(
      generate({ ...args, schemaName: "case_draft_v3" }),
      (error: unknown) => error instanceof AiProviderError && error.code === "output-limit",
    );
    assert.equal(steps[0]?.outputTokens, 18000);
    assert.equal(Object.hasOwn(steps[0]!, "output"), false);
  });
  it("pins Terra to standard pricing and preserves reasoning and schema", async () => {
    const steps: ModelStep[] = [];
    const generate = createBackgroundGenerator({
      apiKey: "test",
      steps,
      serviceTier: "default",
      save: async () => {},
      transport: (async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        assert.equal(body.service_tier, "default");
        assert.equal(body.max_output_tokens, 16000);
        assert.equal(body.model, "gpt-6.1-terra");
        assert.deepEqual(body.reasoning, { effort: "medium" });
        assert.deepEqual(body.text.format.schema, args.schema);
        assert.equal(body.instructions, args.instructions);
        return Response.json({
          id: "resp_test",
          status: "completed",
          model: "gpt-6.1-terra",
          service_tier: "default",
          output_text: '{"ok":true}',
        });
      }) as typeof fetch,
    });
    assert.deepEqual(await generate(args), { ok: true });
    assert.equal(steps[0]!.serviceTier, "default");
  });
  it("refuses a paid request when its budget cannot be reserved", async () => {
    let calls = 0,
      saves = 0;
    const generate = createBackgroundGenerator({
      apiKey: "test",
      steps: [],
      save: async () => {
        saves++;
      },
      beforeSubmit: async ({ step, maximumCostUsd }) => {
        assert.equal(step, 0);
        assert.ok(maximumCostUsd > 0 && maximumCostUsd < 0.12);
        throw new AiProviderError("spend-limit");
      },
      transport: (async () => {
        calls++;
        return response("completed", '{"ok":true}');
      }) as typeof fetch,
    });
    await assert.rejects(generate(args), /Kostnadsgrensen/);
    assert.equal(calls, 0);
    assert.equal(saves, 0);
  });
  it("caps output and rejects oversized inputs before a paid call", async () => {
    let calls = 0;
    const generate = createBackgroundGenerator({
      apiKey: "test",
      steps: [],
      maxOutputTokens: 1000000,
      save: async () => {},
      transport: (async (_url, init) => {
        calls++;
        assert.equal(JSON.parse(String(init?.body)).max_output_tokens, 22000);
        return response("completed", '{"ok":true}');
      }) as typeof fetch,
    });
    await assert.rejects(generate({ ...args, input: "x".repeat(160001) }), /Kostnadsgrensen/);
    assert.equal(calls, 0);
    const bounded = createBackgroundGenerator({
      apiKey: "test",
      steps: [],
      maxOutputTokens: 1000000,
      save: async () => {},
      transport: (async (_u, init) => {
        assert.equal(JSON.parse(String(init?.body)).max_output_tokens, 22000);
        return response("completed", '{"ok":true}');
      }) as typeof fetch,
    });
    await bounded(args);
  });
  it("allows at most two purchases for a generation and never reserves for polling", async () => {
    let reserves = 0;
    const hash = await digest(args);
    const generate = createBackgroundGenerator({
      apiKey: "test",
      steps: [
        { hash, output: { ok: true } },
        { hash, output: { ok: true } },
      ],
      maxSteps: 2,
      save: async () => {},
      beforeSubmit: async () => {
        reserves++;
      },
    });
    await generate(args);
    await generate(args);
    await assert.rejects(generate(args), /Kostnadsgrensen/);
    const poll = createBackgroundGenerator({
      apiKey: "test",
      steps: [{ hash, responseId: "resp_test" }],
      save: async () => {},
      beforeSubmit: async () => {
        reserves++;
      },
      transport: (async () => response("completed", '{"ok":true}')) as typeof fetch,
    });
    await poll(args);
    assert.equal(reserves, 0);
  });
  it("limits each Edge invocation to one provider request even for immediate completions", async () => {
    let calls = 0;
    const steps: ModelStep[] = [];
    const generate = createBackgroundGenerator({
      apiKey: "test",
      steps,
      save: async () => {},
      transport: (async () => {
        calls++;
        return response("completed", '{"ok":true}');
      }) as typeof fetch,
    });
    assert.deepEqual(await generate(args), { ok: true });
    await assert.rejects(generate({ ...args, schemaName: "next_step" }), PendingModel);
    assert.equal(calls, 1);
    assert.equal(steps.length, 1);
  });
  it("submits once, polls across invocations and replays a private checkpoint", async () => {
    const steps: ModelStep[] = [];
    let calls = 0,
      saves = 0;
    const transport = (async (url, init) => {
      calls++;
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-key");
      if (calls === 1) {
        assert.equal(saves, 1);
        assert.equal(String(url), "https://api.openai.com/v1/responses");
        const body = JSON.parse(String(init?.body));
        assert.equal(body.model, "gpt-6.1-terra");
        assert.equal(body.background, true);
        assert.equal(body.store, false);
        assert.equal(body.text.format.strict, true);
        return response("queued");
      }
      assert.equal(init?.method, "GET");
      assert.equal(String(url), "https://api.openai.com/v1/responses/resp_test");
      return calls === 2 ? response("in_progress") : response("completed", '{"ok":true}');
    }) as typeof fetch;
    const make = () =>
      createBackgroundGenerator({
        apiKey: "test-key",
        steps,
        save: async () => {
          saves++;
        },
        transport,
      });
    await assert.rejects(make()(args), PendingModel);
    assert.equal(steps[0]!.status, "queued");
    await assert.rejects(make()(args), PendingModel);
    assert.equal(steps[0]!.status, "in_progress");
    assert.deepEqual(await make()(args), { ok: true });
    assert.equal(steps[0]!.status, "completed");
    assert.deepEqual(await make()(args), { ok: true });
    assert.equal(calls, 3);
    assert.equal(steps.length, 1);
  });
  it("does not repurchase an ambiguous submission or reuse a mismatched prompt", async () => {
    let calls = 0;
    const transport = (async () => {
      calls++;
      throw new Error("unexpected");
    }) as typeof fetch;
    const steps = [{ hash: await digest(args) }];
    const make = () =>
      createBackgroundGenerator({ apiKey: "test", steps, save: async () => {}, transport });
    await assert.rejects(make()(args), AiProviderError);
    await assert.rejects(make()({ ...args, input: "changed" }), AiProviderError);
    assert.equal(calls, 0);
  });
  it("preserves quota errors and rejects a substituted model or malformed result", async () => {
    for (const result of [
      Response.json({ error: { code: "insufficient_quota", message: "private" } }, { status: 429 }),
      Response.json({
        id: "resp_test",
        status: "completed",
        model: "other-model",
        output_text: "{}",
      }),
      response("completed", "private-invalid-json"),
    ]) {
      const generate = createBackgroundGenerator({
        apiKey: "test",
        steps: [],
        save: async () => {},
        transport: (async () => result) as typeof fetch,
      });
      await assert.rejects(generate(args), (error) => {
        assert.ok(error instanceof AiProviderError);
        assert.doesNotMatch(error.message, /private/);
        return true;
      });
    }
  });
});

describe("Supabase boundary", () => {
  it("reports a failed checkpoint cleanup instead of claiming deletion completed", async () => {
    const original = globalThis.fetch;
    const userId = "00000000-0000-4000-8000-000000000001";
    globalThis.fetch = (async (url) => {
      if (String(url).includes("/auth/v1/user")) return Response.json({ id: userId });
      if (String(url).includes("/rest/v1/generated_cases"))
        return new Response(null, { status: 204 });
      if (String(url).includes("/rest/v1/case_ai_jobs"))
        return Response.json({ message: "private database diagnostic" }, { status: 500 });
      throw new Error("Unexpected request");
    }) as typeof fetch;
    try {
      const handler = createCaseHandler(() => ({
        supabaseUrl: "https://example.supabase.co",
        publicKey: "public-test",
        serviceKey: "private-test",
        openaiKey: "",
      }));
      const response = await handler(
        new Request("https://example.test", {
          method: "POST",
          headers: { Authorization: "Bearer a.b.c" },
          body: JSON.stringify({ action: "delete", data: { id: crypto.randomUUID() } }),
        }),
      );
      assert.equal(response.status, 503);
      const body = await response.json();
      assert.match(body.error, /oppgavedata/);
      assert.doesNotMatch(body.error, /private database diagnostic/);
    } finally {
      globalThis.fetch = original;
    }
  });
  it("rejects unauthenticated requests before reading secrets or calling providers", async () => {
    const handler = createCaseHandler(() => {
      throw new Error("must not read environment");
    });
    for (const token of [undefined, "Bearer sb_publishable_test", "Basic abc"]) {
      const result = await handler(
        new Request("https://example.test", {
          method: "POST",
          headers: token ? { Authorization: token } : {},
          body: JSON.stringify({ action: "list" }),
        }),
      );
      assert.equal(result.status, 401);
    }
    assert.equal(
      (await handler(new Request("https://example.test", { method: "OPTIONS" }))).status,
      204,
    );
  });
  it("accepts only fixed application actions, bounded answers and supported audio", () => {
    assert.equal(actionSchema.safeParse({ action: "proxy", prompt: "arbitrary" }).success, false);
    assert.equal(actionSchema.safeParse({ action: "list", userId: "another-user" }).success, false);
    assert.equal(
      actionSchema.safeParse({
        action: "transcribe",
        data: { audio: "AAAA", mimeType: "text/html" },
      }).success,
      false,
    );
    assert.equal(
      actionSchema.safeParse({
        action: "generate",
        requestId: crypto.randomUUID(),
        data: {
          format: "quick",
          stages: 4,
          topic: "auto",
          startSetting: "auto",
          difficulty: "advanced",
        },
      }).success,
      false,
    );
  });
});
