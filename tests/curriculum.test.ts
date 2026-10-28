import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CLINICAL_BLUEPRINTS,
  TOPICS,
  START_SETTINGS,
  drawVariety,
  semanticFingerprint,
  isTopicSettingCompatible,
  type HistoryEntry,
  type VarietyDraw,
} from "../src/lib/case-variety";
import { SOURCES, SOURCE_VERSION, sourceContext } from "../src/lib/case-sources.server";
import { bloodGasReferenceRanges } from "../src/lib/blood-gas";

function historyOf(draw: VarietyDraw): HistoryEntry {
  return {
    engine: draw.decision,
    presentation: draw.topicId,
    setting: draw.settingId,
    diagnosis_family: draw.diagnosisFamily,
    blueprintId: draw.blueprintId,
    fingerprint: draw.fingerprint,
    mechanism: draw.mechanism,
    reasoningTarget: draw.reasoningTarget,
    pivotalFindings: draw.pivotalEvidence,
  };
}
const options = { startSetting: "auto", difficulty: "advanced" } as const;

describe("Source-grounded curriculum", () => {
  it("covers the syllabus beyond the previous exam examples", () => {
    const topics = new Set(TOPICS.map((t) => t.id));
    for (const id of [
      "circulation",
      "infection",
      "pediatrics",
      "geriatrics",
      "trauma-neuro",
      "metabolic",
      "abdomen",
      "mental-health",
      "substance",
      "treatment-limits",
      "safeguarding",
      "oncology",
      "ent",
      "postoperative",
      "blood-gas",
    ])
      assert.ok(topics.has(id), id);
    for (const family of [
      "diabetisk-ketoacidose",
      "hyperosmolart-hyperglykemisk-syndrom",
      "binyrebarkkrise",
      "hyponatremi",
      "malign-medullakompresjon",
      "hyperkalsemi",
      "peritonsillaer-abscess",
      "postoperativ-ileus",
      "etterlatte-ved-braa-doed",
      "prioritering-av-akutt-syke-barn",
      "akutte-smerter-under-lar",
    ])
      assert.ok(
        CLINICAL_BLUEPRINTS.some((b) => b.diagnosisFamily === family),
        family,
      );
  });
  it("gives every blueprint evidence, complete-data requirements and resolvable clinical sources", () => {
    assert.equal(new Set(CLINICAL_BLUEPRINTS.map((b) => b.id)).size, CLINICAL_BLUEPRINTS.length);
    assert.equal(new Set(SOURCES.map((s) => s.id)).size, SOURCES.length);
    const ids = new Set(SOURCES.map((s) => s.id));
    const pedagogical = new Set(["study-guide", "assignment-1", "assignment-2", "self-harm"]);
    for (const b of CLINICAL_BLUEPRINTS) {
      assert.ok(b.minAge <= b.maxAge && b.settings.length);
      assert.ok(b.reasoningTargets.length >= 2 && b.mechanism.length);
      assert.ok(
        b.requiredData.some((d) => d.includes("ingen avgjørende opplysninger holdes tilbake")),
      );
      assert.ok(b.requiredData.some((d) => d.includes("dose, enhet")));
      for (const focus of b.reasoningTargets) assert.ok(focus.pivotalEvidence.length >= 2);
      for (const id of b.sourceIds) assert.ok(ids.has(id), b.id + ": " + id);
      assert.ok(b.sourceIds.some((id) => !pedagogical.has(id)));
    }
    assert.ok(SOURCE_VERSION.endsWith("v3"));
    assert.match(sourceContext(["fluid-balance"]), /ORIGINALEN/);
    assert.match(sourceContext(["assignment-2"]), /tvetydig/);
  });
  it("uses one compatibility rule for UI and draws, including gas and age restrictions", () => {
    for (const t of TOPICS)
      for (const setting of START_SETTINGS) {
        const compatible = isTopicSettingCompatible(t.id, setting.id);
        if (!compatible) {
          assert.throws(() =>
            drawVariety([], { ...options, topic: t.id, startSetting: setting.id }),
          );
        } else {
          const d = drawVariety([], { ...options, topic: t.id, startSetting: setting.id }, () => 0);
          if (setting.id !== "auto") assert.equal(d.settingId, setting.id);
          if (d.settingId === "sykehjem") assert.ok(d.minAge >= 70);
          if (d.settingId === "kad") assert.ok(d.minAge >= 18);
          assert.ok(d.minAge <= d.maxAge);
          if (d.bloodGasRelevant)
            assert.ok(["legevakt", "mottak", "sengepost"].includes(d.settingId));
        }
      }
    assert.equal(isTopicSettingCompatible("postoperative", "fastlege"), false);
    assert.equal(isTopicSettingCompatible("blood-gas", "telefon"), false);
    assert.equal(isTopicSettingCompatible("pediatrics", "sykehjem"), false);
    assert.equal(isTopicSettingCompatible("not-a-topic", "auto"), false);
    assert.equal(isTopicSettingCompatible("auto", "telefon"), true);
  });
  it("keeps blood-gas practice anchored in a real clinical presentation", () => {
    const d = drawVariety(
      [],
      { ...options, topic: "blood-gas", blueprintId: "sglt2-dka" },
      () => 0,
    );
    assert.equal(d.diagnosisFamily, "diabetisk-ketoacidose");
    assert.ok(d.bloodGasRelevant);
    assert.ok(d.requiredData.some((s) => s.includes("Påkrevd blodgass")));
    assert.ok(d.sourceIds.includes("fluid-balance") && d.sourceIds.includes("sglt2-current"));
    assert.throws(() => drawVariety([], { ...options, topic: "ent", blueprintId: "sglt2-dka" }));
  });
  it("integrates bereavement into a complete long acute course, not a short diagnostic case", () => {
    assert.throws(() =>
      drawVariety([], { ...options, blueprintId: "sudden-death", format: "quick" }),
    );
    const d = drawVariety([], { ...options, blueprintId: "sudden-death", format: "long" }, () => 0);
    assert.ok(
      d.requiredData.some((s) => s.includes("premortale") && s.includes("måletidspunkter")),
    );
    assert.ok(d.holisticFocus.some((s) => s.includes("ikke konstruer nye pasientvitalia")));
    for (const format of ["quick", "long"] as const)
      for (const topic of TOPICS)
        for (const setting of START_SETTINGS) {
          if (isTopicSettingCompatible(topic.id, setting.id, format)) {
            const selected = drawVariety([], {
              ...options,
              topic: topic.id,
              startSetting: setting.id,
              format,
            });
            const blueprint = CLINICAL_BLUEPRINTS.find((b) => b.id === selected.blueprintId)!;
            assert.ok(blueprint.formats.includes(format));
          } else {
            assert.throws(() =>
              drawVariety([], { ...options, topic: topic.id, startSetting: setting.id, format }),
            );
          }
        }
  });
});

describe("Semantic variety", () => {
  it("does not treat new demographics, setting or narrative trajectory as a new clinical problem", () => {
    const b = CLINICAL_BLUEPRINTS[0]!;
    const focus = b.reasoningTargets[0]!;
    const cosmetic = {
      ...b,
      id: "different-name",
      minAge: 60,
      maxAge: 80,
      trajectories: ["new wording"],
    };
    assert.equal(semanticFingerprint(b, focus), semanticFingerprint(cosmetic, focus));
    assert.notEqual(
      semanticFingerprint(b, focus),
      semanticFingerprint({ ...b, mechanism: "different mechanism" }, focus),
    );
    assert.notEqual(semanticFingerprint(b, focus), semanticFingerprint(b, b.reasoningTargets[1]!));
  });
  it("uses actual family history and retains common diagnoses after all variants were seen", () => {
    const first = drawVariety([], { ...options, topic: "circulation" }, () => 0);
    const second = drawVariety([historyOf(first)], { ...options, topic: "circulation" }, () => 0);
    assert.notEqual(second.diagnosisFamily, first.diagnosisFamily);
    const repeated: HistoryEntry[] = [];
    for (let i = 0; i < 6; i++) {
      const d = drawVariety(
        repeated,
        { ...options, topic: "circulation", blueprintId: "acs" },
        () => 0,
      );
      assert.equal(d.diagnosisFamily, "akutt-koronarsyndrom");
      repeated.unshift(historyOf(d));
    }
    assert.equal(new Set(repeated.map((h) => h.fingerprint)).size, 2);
  });
  it("balances curriculum coverage without permanently excluding repeated families", () => {
    const history: HistoryEntry[] = [];
    const counts = new Map<string, number>();
    const scenarios = new Set<string>();
    let seed = 19;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < TOPICS.length * 8; i++) {
      const d = drawVariety(history, options, random);
      history.unshift(historyOf(d));
      counts.set(d.topicId, (counts.get(d.topicId) ?? 0) + 1);
      scenarios.add(d.blueprintId);
    }
    assert.equal(counts.size, TOPICS.length);
    assert.ok([...counts.values()].every((count) => count === 8));
    assert.ok(scenarios.size >= 40, "should vary real scenarios, not just age or setting");
  });
  it("reads legacy v2 fingerprints for repeat avoidance without leaking them into family semantics", () => {
    const first = drawVariety([], { ...options, blueprintId: "acs" }, () => 0);
    const second = drawVariety(
      [
        {
          engine: first.decision,
          presentation: first.topicId,
          setting: first.settingId,
          diagnosis_family: first.fingerprint,
        },
      ],
      { ...options, topic: first.topicId, blueprintId: "acs" },
      () => 0,
    );
    assert.notEqual(second.fingerprint, first.fingerprint);
    assert.equal(second.diagnosisFamily, "akutt-koronarsyndrom");
  });
});

describe("Blood-gas reference context", () => {
  it("distinguishes specimen, local ranges and pediatric limitations", () => {
    const arterial = bloodGasReferenceRanges("arterial", 55);
    const venous = bloodGasReferenceRanges("venous", 55);
    assert.notEqual(arterial.pH, venous.pH);
    assert.notEqual(arterial.bicarbonate, venous.bicarbonate);
    assert.match(venous.pO2, /Ikke referanse/);
    assert.match(arterial.note, /ikke en egen validert SBE/);
    const child = bloodGasReferenceRanges("arterial", 0);
    assert.match(child.pO2, /timer\/døgn/);
    assert.match(child.note, /aldersvurdering/);
    assert.match(child.baseExcess, /Alders/);
  });
});
