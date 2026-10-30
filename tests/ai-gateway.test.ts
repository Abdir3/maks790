import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AiProviderError,
  generateJson,
  providerErrorFromResponse,
  readResponseJson,
} from "../src/lib/ai-gateway.server";

const originalFetch = globalThis.fetch;
const originalOpenAI = process.env["OPENAI_API_KEY"];
const originalLovable = process.env["LOVABLE_API_KEY"];
const request = {
  instructions: "Return the requested JSON.",
  input: "Connection test",
  schemaName: "connection_test",
  schema: {
    type: "object",
    properties: { ok: { type: "boolean" } },
    required: ["ok"],
    additionalProperties: false,
  },
};
const stream = (...events: unknown[]) =>
  new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""), {
    headers: { "Content-Type": "text/event-stream" },
  });
function stubFetch(
  handler: (url: string | URL | Request, init?: RequestInit) => Promise<Response>,
) {
  globalThis.fetch = handler as typeof fetch;
  process.env["OPENAI_API_KEY"] = "openai-test-key";
  process.env["LOVABLE_API_KEY"] = "lovable-test-key";
}
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalOpenAI === undefined) delete process.env["OPENAI_API_KEY"];
  else process.env["OPENAI_API_KEY"] = originalOpenAI;
  if (originalLovable === undefined) delete process.env["LOVABLE_API_KEY"];
  else process.env["LOVABLE_API_KEY"] = originalLovable;
});

describe("Direct OpenAI billing and authentication", () => {
  it("uses the OpenAI account even when a Lovable key is present", async () => {
    let calls = 0;
    stubFetch(async (url, init) => {
      calls++;
      assert.equal(url, "https://api.openai.com/v1/responses");
      assert.equal(init?.method, "POST");
      assert.equal(init?.redirect, "error");
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("Authorization"), "Bearer openai-test-key");
      assert.equal(headers.has("Lovable-API-Key"), false);
      assert.equal(headers.has("X-Lovable-AIG-SDK"), false);
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, "gpt-6-astra");
      assert.equal(body.store, false);
      assert.equal(body.stream, true);
      assert.deepEqual(body.reasoning, { effort: "medium" });
      assert.deepEqual(body.text.format, {
        type: "json_schema",
        name: request.schemaName,
        strict: true,
        schema: request.schema,
      });
      return stream({
        type: "response.completed",
        response: {
          id: "resp-test",
          model: "gpt-6-astra",
          status: "completed",
          output: [{ content: [{ type: "output_text", text: '{"ok":true}' }] }],
          usage: { input_tokens: 12, output_tokens: 5 },
        },
      });
    });
    process.env["OPENAI_API_KEY"] = "  openai-test-key\n";
    const metadata: unknown[] = [];
    assert.deepEqual(
      await generateJson({ ...request, onResponse: (value) => metadata.push(value) }),
      {
        ok: true,
      },
    );
    assert.equal(calls, 1);
    assert.deepEqual(metadata, [
      { id: "resp-test", model: "gpt-6-astra", inputTokens: 12, outputTokens: 5 },
    ]);
  });

  it("fails before making a request when the OpenAI key is absent or blank", async () => {
    let calls = 0;
    stubFetch(async () => {
      calls++;
      throw new Error("should not call any provider");
    });
    for (const key of [undefined, "", " \n "]) {
      if (key === undefined) delete process.env["OPENAI_API_KEY"];
      else process.env["OPENAI_API_KEY"] = key;
      await assert.rejects(generateJson(request), (error: unknown) => {
        assert.ok(error instanceof AiProviderError);
        assert.equal(error.code, "authentication");
        assert.match(error.message, /OpenAI/);
        return true;
      });
    }
    assert.equal(calls, 0);
  });

  for (const [providerCode, expected] of [
    ["insufficient_quota", "usage-limited"],
    ["billing_hard_limit_reached", "usage-limited"],
    ["project_spend_limit_exceeded", "usage-limited"],
    ["rate_limit_exceeded", "rate-limited"],
  ]) {
    it(`distinguishes ${providerCode} from other HTTP 429 failures without retrying`, async () => {
      let calls = 0;
      stubFetch(async () => {
        calls++;
        return Response.json(
          { error: { code: providerCode, message: "private-provider-detail" } },
          { status: 429 },
        );
      });
      await assert.rejects(generateJson(request), (error: unknown) => {
        assert.ok(error instanceof AiProviderError);
        assert.equal(error.code, expected);
        assert.doesNotMatch(
          error.message,
          /private-provider-detail|lovable-test-key|openai-test-key/,
        );
        if (expected === "usage-limited") assert.match(error.message, /OpenAI/);
        return true;
      });
      assert.equal(calls, 1);
    });
  }

  it("uses safe status fallbacks for invalid, oversized and non-JSON error bodies", async () => {
    for (const [body, status, expected] of [
      ["null", 401, "authentication"],
      ["<html>private-provider-detail</html>", 502, "unavailable"],
      ["x".repeat(17000), 429, "rate-limited"],
      ['{"error":{"code":"unrecognized_code"}}', 402, "credits-exhausted"],
    ] as const) {
      const response = new Response(body, { status });
      const error = await providerErrorFromResponse(response);
      assert.equal(error.code, expected);
      assert.doesNotMatch(error.message, /private-provider-detail|unrecognized_code/);
      assert.equal(response.body?.locked, false);
    }
  });

  it("classifies an OpenAI quota error delivered inside an HTTP 200 stream", async () => {
    stubFetch(async () =>
      stream({
        type: "response.failed",
        response: { error: { code: "insufficient_quota", message: "private-provider-detail" } },
      }),
    );
    await assert.rejects(generateJson(request), (error: unknown) => {
      assert.ok(error instanceof AiProviderError);
      assert.equal(error.code, "usage-limited");
      assert.match(error.message, /OpenAI/);
      assert.doesNotMatch(error.message, /private-provider-detail/);
      return true;
    });
  });

  it("sanitizes network failures and identifies timeouts", async () => {
    for (const [failure, expected] of [
      [new Error("private-provider-detail"), "unavailable"],
      [new DOMException("private-provider-detail", "TimeoutError"), "timeout"],
      [new DOMException("private-provider-detail", "AbortError"), "timeout"],
    ] as const) {
      stubFetch(async () => {
        throw failure;
      });
      await assert.rejects(generateJson(request), (error: unknown) => {
        assert.ok(error instanceof AiProviderError);
        assert.equal(error.code, expected);
        assert.doesNotMatch(error.message, /private-provider-detail/);
        return true;
      });
    }
  });

  it("keeps malformed model output out of client errors", async () => {
    const response = stream({
      type: "response.completed",
      response: { status: "completed", output_text: "private-provider-detail" },
    });
    await assert.rejects(readResponseJson(response.body!), (error: unknown) => {
      assert.ok(error instanceof AiProviderError);
      assert.equal(error.code, "unavailable");
      assert.doesNotMatch(error.message, /private-provider-detail/);
      return true;
    });
  });
});
