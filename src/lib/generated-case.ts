import {
  validateCase,
  type CaseDefinition,
  type ClinicalResultGroup,
  type ContentBlock,
  type Measurement,
} from "./case-model";
import type { GeneratedCase } from "./case-contract";
import type { VarietyDraw } from "./case-variety";
import { calculateBloodGas, bloodGasReferenceRanges } from "./blood-gas";
const labels: Record<string, string> = {
  bp: "Blodtrykk",
  pulse: "Puls",
  respiration: "Respirasjonsfrekvens",
  spo2: "SpO₂",
  temperature: "Temperatur",
  gcs: "GCS",
  glucose: "Glukose",
  lactate: "Laktat",
  consciousness: "Bevissthet og kontakt",
  capillaryRefill: "Kapillær fylningstid",
  weight: "Vekt",
};

/** One clock for observations, medication and results, including before arrival. */
export function timelineLabel(minutes: number): string {
  if (minutes === 0) return "Ved første vurdering";
  const absolute = Math.abs(minutes),
    days = Math.floor(absolute / 1440),
    hours = Math.floor((absolute % 1440) / 60),
    mins = absolute % 60;
  const duration = [
    days ? `${days} døgn` : "",
    hours ? `${hours} t` : "",
    mins ? `${mins} min` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `${duration} ${minutes < 0 ? "før" : "etter"} første vurdering`;
}
export function normaliseClinicalData(g: GeneratedCase): GeneratedCase {
  return {
    ...g,
    stages: g.stages.map((stage) => ({
      ...stage,
      timeLabel: timelineLabel(stage.elapsedMinutes),
      bloodGas: stage.bloodGas.map((gas) => ({
        ...gas,
        // Derive from exactly the primary numbers shown to the learner.
        pH: Number(gas.pH.toFixed(2)),
        pCO2: Number(gas.pCO2.toFixed(2)),
        pO2: Number(gas.pO2.toFixed(2)),
        sampledAt: timelineLabel(gas.timeMinutes),
      })),
    })),
  };
}
function investigations(
  stage: GeneratedCase["stages"][number],
  partId: string,
  ageYears: number,
): ClinicalResultGroup[] {
  const groups: ClinicalResultGroup[] = [];
  for (const lab of stage.laboratory) {
    const id = `${partId}-lab-${lab.timeMinutes}-${lab.sampleType}`;
    let group = groups.find((item) => item.id === id);
    if (!group) {
      group = {
        id,
        kind: "laboratory",
        title: "Laboratoriesvar",
        timestamp: timelineLabel(lab.timeMinutes),
        sampleType: lab.sampleType,
        values: [],
      };
      groups.push(group);
    }
    group.values.push({
      id: lab.id,
      label: lab.label,
      value: lab.value,
      unit: lab.unit,
      referenceRange: lab.referenceRange,
    });
  }
  stage.bloodGas.forEach((input, index) => {
    const gas = calculateBloodGas(input),
      arterial = gas.sampleType === "arterial";
    const refs = bloodGasReferenceRanges(gas.sampleType, ageYears);
    groups.push({
      id: `${partId}-gas-${index}`,
      kind: "blood-gas",
      title: "Blodgass",
      timestamp: timelineLabel(input.timeMinutes),
      sampleType: arterial ? "Arteriell" : "Venøs",
      oxygen: gas.oxygen,
      findings: refs.note,
      sourceUrl: refs.sourceUrl,
      values: [
        { id: "ph", label: "pH", value: gas.pH.toFixed(2), referenceRange: refs.pH },
        {
          id: "pco2",
          label: "pCO₂",
          value: gas.pCO2.toFixed(2),
          unit: "kPa",
          referenceRange: refs.pCO2,
        },
        {
          id: "po2",
          label: "pO₂",
          value: gas.pO2.toFixed(2),
          unit: "kPa",
          referenceRange: refs.pO2,
        },
        {
          id: "hco3",
          label: "HCO₃⁻ (faktisk)",
          value: gas.bicarbonate.toFixed(1),
          unit: "mmol/L",
          referenceRange: refs.bicarbonate,
        },
        {
          id: "be",
          label: "BE(Ecf), standard",
          value: gas.baseExcess.toFixed(1),
          unit: "mmol/L",
          referenceRange: refs.baseExcess,
        },
      ],
    });
  });
  stage.reports.forEach((r, i) =>
    groups.push({
      id: `${partId}-${r.kind}-${i}`,
      kind: r.kind,
      title: r.kind === "ecg" ? "EKG – tolket rapport" : "Bildediagnostikk",
      timestamp: timelineLabel(r.timeMinutes),
      values: [],
      findings: r.findings,
      conclusion: r.conclusion,
    }),
  );
  return groups;
}
export function buildDefinition(
  id: string,
  generated: GeneratedCase,
  draw: VarietyDraw,
): CaseDefinition {
  let n = 0;
  const age =
    generated.ageYears >= 1
      ? `${generated.ageYears.toLocaleString("nb-NO")} år`
      : generated.ageYears >= 1 / 12
        ? `${Math.round(generated.ageYears * 12)} måneder`
        : generated.ageYears > 0
          ? `${Math.max(1, Math.round(generated.ageYears * 365))} dager`
          : "nyfødt";
  const name = generated.patient
    .replace(/[,\s(]*\d+(?:[.,]\d+)?\s*(?:år|måneder|uker|dager)(?: gammel)?[)\s.]*$/i, "")
    .trim();
  return validateCase({
    id,
    title: `Vakt: ${draw.setting}`,
    patient: `${name}, ${age}`,
    practice: { version: 3, difficulty: draw.difficulty, sequential: false },
    background: [
      { type: "paragraph", title: "Din rolle", text: generated.role },
      ...generated.background.map((text): ContentBlock => ({ type: "paragraph", text })),
    ],
    parts: generated.stages.map((stage, index) => {
      const partId = `${id}-del${index + 1}`;
      const content: ContentBlock[] = stage.paragraphs.map((text) => ({ type: "paragraph", text }));
      content.push({ type: "list", title: "Kliniske funn", items: stage.clinicalFindings });
      if (stage.medications.length)
        content.push({
          type: "list",
          title: "Legemiddelopplysninger",
          items: stage.medications.map(
            (m) =>
              `${m.name} (${m.activeIngredient}) · ${m.dose} · ${m.route}. ${m.schedule}. ${m.context === "given" ? "Gitt" : m.context === "reported" ? "Oppgitt inntak" : "Siste dose"}: ${timelineLabel(m.timeMinutes).toLocaleLowerCase("nb-NO")}.`,
          ),
        });
      return {
        id: partId,
        title: `Del ${index + 1} · ${stage.setting}`,
        shortTitle: `Del ${index + 1}`,
        timeLabel: timelineLabel(stage.elapsedMinutes),
        content,
        measurements: {
          timestamp: timelineLabel(stage.elapsedMinutes),
          values: stage.vitals.map((v) => ({ ...v, label: labels[v.id]! })),
        },
        investigations: investigations(stage, partId, generated.ageYears),
        questions: stage.questions.map((q) => ({
          id: `${id}-q${++n}`,
          label: `Oppgave ${n}`,
          prompt: q.prompt,
        })),
      };
    }) as CaseDefinition["parts"],
  });
}
function contentBlock(b: ContentBlock): ContentBlock {
  const title = b.title === undefined ? {} : { title: b.title };
  return b.type === "list"
    ? { type: b.type, ...title, items: b.items }
    : { type: b.type, ...title, text: b.text };
}
function measurement(v: Measurement): Measurement {
  return {
    id: v.id,
    label: v.label,
    value: v.value,
    ...(v.unit === undefined ? {} : { unit: v.unit }),
    ...(v.note === undefined ? {} : { note: v.note }),
    ...(v.referenceRange === undefined ? {} : { referenceRange: v.referenceRange }),
  };
}
/** Recursive allowlist: private fields never pass from saved JSON to a browser. */
export function publicDefinition(value: unknown): CaseDefinition {
  const d = value as CaseDefinition;
  return validateCase({
    id: d.id,
    title: d.title,
    ...(d.patient ? { patient: d.patient } : {}),
    ...(d.specialty ? { specialty: d.specialty } : {}),
    ...(d.background ? { background: d.background.map(contentBlock) } : {}),
    ...(d.practice
      ? {
          practice: {
            version: d.practice.version,
            difficulty: d.practice.difficulty,
            sequential: false,
          },
        }
      : {}),
    parts: d.parts.map((p) => ({
      id: p.id,
      title: p.title,
      ...(p.shortTitle === undefined ? {} : { shortTitle: p.shortTitle }),
      ...(p.timeLabel === undefined ? {} : { timeLabel: p.timeLabel }),
      content: p.content.map(contentBlock),
      ...(p.measurements
        ? {
            measurements: {
              timestamp: p.measurements.timestamp,
              values: p.measurements.values.map(measurement),
            },
          }
        : {}),
      ...(p.afterMeasurements ? { afterMeasurements: p.afterMeasurements.map(contentBlock) } : {}),
      ...(p.investigations
        ? {
            investigations: p.investigations.map((g) => ({
              id: g.id,
              kind: g.kind,
              title: g.title,
              timestamp: g.timestamp,
              ...(g.sampleType === undefined ? {} : { sampleType: g.sampleType }),
              ...(g.oxygen === undefined ? {} : { oxygen: g.oxygen }),
              values: g.values.map(measurement),
              ...(g.conclusion === undefined ? {} : { conclusion: g.conclusion }),
              ...(g.findings === undefined ? {} : { findings: g.findings }),
              ...(g.sourceUrl === undefined ? {} : { sourceUrl: g.sourceUrl }),
            })),
          }
        : {}),
      questions: p.questions.map((q) =>
        "subquestions" in q
          ? {
              id: q.id,
              label: q.label,
              ...(q.prompt === undefined ? {} : { prompt: q.prompt }),
              subquestions: q.subquestions.map((c) => ({
                id: c.id,
                label: c.label,
                prompt: c.prompt,
              })),
            }
          : { id: q.id, label: q.label, prompt: q.prompt },
      ),
    })) as CaseDefinition["parts"],
  });
}
