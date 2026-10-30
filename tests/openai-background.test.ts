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
    model: "gpt-6-astra",
    status,
    ...(output ? { output: [{ content: [{ type: "output_text", text: output }] }] } : {}),
  });

describe("Resumable Astra responses", () => {
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
        assert.equal(body.model, "gpt-6-astra");
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
    await assert.rejects(make()(args), PendingModel);
    assert.deepEqual(await make()(args), { ok: true });
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
