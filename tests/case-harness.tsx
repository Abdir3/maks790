// Development-only harness. Not imported by the application or its production build.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { CaseWorkspace } from "../src/components/case-workspace";
import { browserFixtures } from "./case-fixtures";
import { generatedDefinition, generatedFixture, feedbackFixture, draw } from "./generator-fixtures";
import { allQuestions, type CaseDefinition, type ClinicalResultGroup } from "../src/lib/case-model";
import { buildDefinition } from "../src/lib/generated-case";
const investigations: ClinicalResultGroup[] = [
  {
    id: "harness-laboratory",
    kind: "laboratory",
    title: "Laboratorieprøver",
    timestamp: "Dag 1, 15:05",
    sampleType: "Venøst blod",
    values: [
      { id: "sodium", label: "Natrium", value: "137", unit: "mmol/L", referenceRange: "137–145" },
      { id: "potassium", label: "Kalium", value: "4,3", unit: "mmol/L", referenceRange: "3,5–4,6" },
      {
        id: "creatinine",
        label: "Kreatinin",
        value: "112",
        unit: "µmol/L",
        referenceRange: "45–90",
        note: "Tidligere verdi: 82 µmol/L",
      },
    ],
  },
  {
    id: "harness-blood-gas",
    kind: "blood-gas",
    title: "Blodgass",
    timestamp: "Dag 1, 15:10",
    sampleType: "Venøs prøve",
    oxygen: "Romluft ved prøvetaking",
    findings:
      "Referanseområder vurderes sammen med prøvetype og laboratoriets metode. Referansen i denne nettlesertesten er kun testdata.",
    sourceUrl: "https://example.com/blood-gas-reference",
    values: [
      { id: "ph", label: "pH", value: "7,32" },
      { id: "pco2", label: "pCO₂", value: "6,5", unit: "kPa" },
      { id: "po2", label: "pO₂", value: "4,8", unit: "kPa" },
      { id: "hco3", label: "HCO₃⁻", value: "25", unit: "mmol/L" },
      { id: "base-excess", label: "Baseoverskudd", value: "−1", unit: "mmol/L" },
      { id: "lactate", label: "Laktat", value: "1,4", unit: "mmol/L" },
    ],
  },
  {
    id: "harness-ecg",
    kind: "ecg",
    title: "EKG-rapport",
    timestamp: "Dag 1, 15:15",
    values: [],
    findings: "Sinusrytme, 88/min. Ingen akutte ST-forandringer.",
    conclusion: "Ingen akutte iskemiske EKG-forandringer.",
  },
  {
    id: "harness-imaging",
    kind: "imaging",
    title: "Bildediagnostisk rapport",
    timestamp: "Dag 1, 15:30",
    values: [],
    findings: "Røntgen thorax viser ingen fokale fortetninger eller pleuravæske.",
    conclusion: "Ingen akutte funn på røntgen thorax.",
  },
];
function withInvestigations(definition: CaseDefinition): CaseDefinition {
  return {
    ...definition,
    practice: { version: 3, difficulty: "complex", sequential: false },
    parts: definition.parts.map((part, index) => ({
      ...part,
      ...(index === 0 ? { investigations } : {}),
    })),
  };
}
const legacy = buildDefinition("legacy-harness", generatedFixture(), draw);
const fixtures = [
  ...browserFixtures,
  withInvestigations(generatedDefinition),
  withInvestigations(buildDefinition("quick-harness", generatedFixture(1), draw)),
  {
    ...legacy,
    title: "Eldre øvingscase (v2)",
    practice: { version: 2, difficulty: "complex", sequential: true },
  } satisfies CaseDefinition,
];
import "../src/styles.css";

// Test-only microphone: no access to the user's actual audio devices.
class FakeRecorder {
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror = null;
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["test audio"]) });
    this.onstop?.();
  }
}
Object.defineProperty(navigator, "mediaDevices", {
  configurable: true,
  value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) },
});
window.MediaRecorder = FakeRecorder as unknown as typeof MediaRecorder;
const storageSetItem = Storage.prototype.setItem;

export function Harness() {
  const [index, setIndex] = useState(0);
  const [largeText, setLargeText] = useState(false);
  const [storageFailure, setStorageFailure] = useState(false);
  const definition = fixtures[index]!;
  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          zIndex: 9999,
          background: "#222",
          padding: 4,
          height: 40,
          fontSize: 12,
        }}
      >
        <label>
          Testcase{" "}
          <select
            aria-label="Testcase"
            value={index}
            onChange={(event) => setIndex(Number(event.target.value))}
          >
            {fixtures.map((item, i) => (
              <option key={item.id} value={i}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={largeText}
            onChange={(event) => setLargeText(event.target.checked)}
          />
          200 % tekst
        </label>
        <label>
          <input
            type="checkbox"
            checked={storageFailure}
            onChange={(event) => {
              setStorageFailure(event.target.checked);
              Storage.prototype.setItem = event.target.checked
                ? () => {
                    throw new Error("Simulated quota error");
                  }
                : storageSetItem;
            }}
          />
          Lagringsfeil
        </label>
      </div>
      <style>{`html { font-size: ${largeText ? 32 : 16}px; } .case-workspace { padding-bottom: 40px; }`}</style>
      <CaseWorkspace
        key={definition.id}
        definition={definition}
        onExit={() => setIndex((value) => (value + 1) % fixtures.length)}
        {...(definition.practice?.version === 3
          ? {
              onAssess: async (answers: Record<string, string>, solutionViewed?: boolean) => ({
                feedback: {
                  summary: `Simulert tilbakemelding for nettlesertest. Ingen reell modellvurdering.${solutionViewed ? " Øvd med løsningsforslag." : ""}`,
                  questions: allQuestions(definition).flatMap(
                    (q) => feedbackFixture(q.id, answers[q.id] ?? "").questions,
                  ),
                },
                sources: [
                  {
                    id: "assignment-2",
                    title: "Testkilde",
                    url: "https://example.com",
                    scope: "Kun testdata.",
                  },
                ],
              }),
              onModelAnswer: async () => ({
                modelAnswer: {
                  summary:
                    "Simulert løsningsforslag for nettlesertest. Ingen reell modellvurdering.",
                  questions: allQuestions(definition).map((q) => ({
                    questionId: q.id,
                    explanation:
                      "Begrunn vurderingen med opplysningene som forelå på dette tidspunktet. Sammenhold ny funksjonssvikt med tidligere funksjon, legemiddelinntak og observasjoner.",
                    keyFindings: [
                      "Endring fra tidligere funksjon og oppmerksomhet.",
                      "Lite inntak og behov for komparentopplysninger.",
                    ],
                    alternatives: ["Flere samtidige forklaringer må vurderes ut fra videre funn."],
                    sourceIds: ["assignment-2"],
                  })),
                },
                sources: [
                  {
                    id: "assignment-2",
                    title: "Testkilde",
                    url: "https://example.com",
                    scope: "Kun testdata.",
                  },
                ],
              }),
            }
          : {})}
      />
    </>
  );
}

const route = createRootRoute({ component: Harness });
const router = createRouter({
  routeTree: route,
  history: createMemoryHistory({ initialEntries: ["/"] }),
});
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
