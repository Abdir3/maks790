import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calibrationPlan, CALIBRATION_SPECS, runCalibration } from "../scripts/calibrate-cases";
import { mkdtemp, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, basename, resolve } from "node:path";
import { AiProviderError } from "../src/lib/ai-gateway.server";
import { CLINICAL_BLUEPRINTS, TOPICS } from "../src/lib/case-variety";

describe("Live calibration selection", () => {
  it("preserves the original core suite for reproducible historical runs", () => {
    const plan = calibrationPlan(790);
    assert.equal(plan.length, CALIBRATION_SPECS.length);
    assert.equal(new Set(plan.map((item) => item.draw.blueprintId)).size, plan.length);
    assert.deepEqual(plan, calibrationPlan(790, "core"));
  });
  it("covers every actual scenario in a compatible format and setting", () => {
    const plan = calibrationPlan(1029, "catalog");
    assert.deepEqual(
      new Set(plan.map((item) => item.draw.blueprintId)),
      new Set(CLINICAL_BLUEPRINTS.map((blueprint) => blueprint.id)),
    );
    assert.equal(new Set(plan.map((item) => item.id)).size, plan.length);
    assert.equal(new Set(plan.map((item) => item.topic)).size, TOPICS.length - 1);
    for (const item of plan) {
      const blueprint = CLINICAL_BLUEPRINTS.find((entry) => entry.id === item.blueprintId)!;
      assert.ok(blueprint.formats.includes(item.format));
      assert.ok(blueprint.settings.includes(item.draw.settingId as never));
      assert.equal(item.stages === 1, item.format === "quick");
    }
    assert.equal(plan.find((item) => item.blueprintId === "sudden-death")?.format, "long");
    assert.deepEqual(plan, calibrationPlan(1029, "catalog"));
  });
  it("stops a live batch after provider failure and does not count unrun cases as clinical failures", async () => {
    const out = await mkdtemp(join(tmpdir(), "maks790-calibration-"));
    let calls = 0;
    try {
      const result = await runCalibration({
        seed: 1029,
        out,
        provider: "openai",
        phase: "generate",
        generate: async () => {
          calls++;
          throw new AiProviderError("credits-exhausted");
        },
      });
      assert.equal(calls, 1);
      assert.equal(result.records[0]?.status, "provider-error");
      assert.ok(
        result.records
          .slice(1)
          .every((record) => record.status === "not-run" && record.modelCalls === 0),
      );
      assert.equal(result.automatedComplete, 0);
      assert.equal(result.productionGatewayVerified, false);
      assert.equal(result.providerFailure?.code, "credits-exhausted");
      assert.match(result.implementationSha256, /^[0-9a-f]{64}$/);
      const manifestPath = join(result.folder, "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      for (const changed of [
        { implementationSha256: "a-different-revision" },
        { executionMode: "live" },
        { plan: [] },
      ]) {
        await writeFile(manifestPath, JSON.stringify({ ...manifest, ...changed }));
        await assert.rejects(
          runCalibration({
            seed: 1029,
            out,
            resume: result.folder,
            provider: "openai",
            generate: async () => {
              calls++;
              throw new Error("Must not call a provider for mismatched evidence.");
            },
          }),
          /annen kode|annen.*testmodus/,
        );
        assert.equal(calls, 1);
      }
    } finally {
      assert.equal(dirname(resolve(out)), resolve(tmpdir()));
      assert.ok(basename(out).startsWith("maks790-calibration-"));
      await rm(out, { recursive: true, force: true });
    }
  });
  it("does not relabel an orphaned result folder as a new verified run", async () => {
    const out = await mkdtemp(join(tmpdir(), "maks790-calibration-"));
    let calls = 0;
    try {
      await writeFile(join(out, "old-result.json"), '{"evidence":"old run without manifest"}');
      await assert.rejects(
        runCalibration({
          seed: 1029,
          out,
          resume: out,
          provider: "openai",
          generate: async () => {
            calls++;
            throw new Error("Must not call a provider without a trustworthy run manifest.");
          },
        }),
        /mangler manifest/,
      );
      assert.equal(calls, 0);
      assert.deepEqual(await readdir(out), ["old-result.json"]);
    } finally {
      assert.equal(dirname(resolve(out)), resolve(tmpdir()));
      assert.ok(basename(out).startsWith("maks790-calibration-"));
      await rm(out, { recursive: true, force: true });
    }
  });
});
