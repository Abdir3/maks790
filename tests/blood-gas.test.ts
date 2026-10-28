import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateBloodGas, validateBloodGas, type BloodGasInput } from "../src/lib/blood-gas";

const input: BloodGasInput = {
  sampleType: "arterial",
  sampledAt: "Dag 1 kl. 14:10, før behandling",
  oxygen: "Romluft",
  pH: 7.4,
  pCO2: 5.33,
  pO2: 12,
};

describe("Deterministic actual bicarbonate and SBE(Ecf)", () => {
  it("matches an independently calculated reference and preserves sample context", () => {
    const gas = calculateBloodGas(input);
    // Independent Python Decimal calculation at 40-digit precision.
    assert.ok(Math.abs(gas.bicarbonate - 24.743153252372256) < 0.00001);
    assert.ok(Math.abs(gas.baseExcess - -0.056846747627744) < 0.00001);
    assert.equal(gas.sampledAt, input.sampledAt);
    assert.equal(gas.oxygen, "Romluft");
    assert.deepEqual(validateBloodGas(gas), []);
  });
  it("rejects the inconsistent ORIGINAL compendium table 4.4D, printed p.150", () => {
    const original = { ...input, pH: 7.55, pCO2: 1.4, bicarbonate: 1, baseExcess: -30 };
    const issues = validateBloodGas(original);
    assert.equal(issues.length, 2);
    const repairedArithmetic = calculateBloodGas(original);
    assert.ok(repairedArithmetic.bicarbonate > 9 && repairedArithmetic.bicarbonate < 10);
    assert.deepEqual(validateBloodGas(repairedArithmetic), []);
    // This only repairs arithmetic. It does not establish the intended clinical case.
  });
  it("accepts near-normal pH with strongly abnormal pCO2/bicarbonate", () => {
    const gas = calculateBloodGas({ ...input, pH: 7.4, pCO2: 2.67 });
    assert.ok(gas.bicarbonate < 13);
    assert.ok(gas.baseExcess < -12);
    assert.deepEqual(validateBloodGas(gas), []);
  });
  it("does not reject mixed acidosis or prolonged respiratory compensation", () => {
    for (const p of [
      { pH: 7.12, pCO2: 8.2 },
      { pH: 7.35, pCO2: 9.1 },
      { pH: 7.5, pCO2: 3.1 },
    ])
      assert.deepEqual(validateBloodGas(calculateBloodGas({ ...input, ...p })), []);
  });
  it("permits venous gases without pretending venous pO2 is arterial oxygenation", () => {
    const gas = calculateBloodGas({ ...input, sampleType: "venous", pO2: 4.2 });
    assert.equal(gas.sampleType, "venous");
    assert.deepEqual(validateBloodGas(gas), []);
  });
  it("allows one decimal presentation rounding but catches altered derived data", () => {
    const gas = calculateBloodGas(input);
    assert.deepEqual(validateBloodGas({ ...gas, bicarbonate: 24.7, baseExcess: -0.1 }), []);
    assert.ok(validateBloodGas({ ...gas, bicarbonate: 29 }).length);
    assert.ok(validateBloodGas({ ...gas, baseExcess: NaN }).length);
  });
  it("requires sample, oxygen and time context and finite positive pressure inputs", () => {
    for (const change of [
      { oxygen: " " },
      { sampledAt: "" },
      { pCO2: 0 },
      { pCO2: NaN },
      { pCO2: 40 },
      { pO2: -1 },
      { pO2: Infinity },
      { pH: NaN },
      { pH: 9 },
      { sampleType: "capillary" as BloodGasInput["sampleType"] },
    ]) {
      assert.ok(validateBloodGas({ ...input, ...change }).length);
      assert.throws(() => calculateBloodGas({ ...input, ...change }));
    }
  });
});
