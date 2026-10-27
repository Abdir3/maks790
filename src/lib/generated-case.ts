import { validateCase, type CaseDefinition } from "./case-model";
import type { GeneratedCase } from "./case-contract";
import type { VarietyDraw } from "./case-variety";
const labels: Record<string, string> = {
  bp: "Blodtrykk",
  pulse: "Puls",
  respiration: "Respirasjonsfrekvens",
  spo2: "SpO₂",
  temperature: "Temperatur",
  gcs: "GCS",
  glucose: "Glukose",
  lactate: "Laktat",
};
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
    practice: { version: 2, difficulty: draw.difficulty, sequential: generated.stages.length > 1 },
    background: generated.background.map((text) => ({ type: "paragraph", text })),
    parts: generated.stages.map((stage, index) => ({
      id: `${id}-del${index + 1}`,
      title: `Del ${index + 1} · ${stage.setting}`,
      shortTitle: `Del ${index + 1}`,
      timeLabel: stage.timeLabel,
      content: stage.paragraphs.map((text) => ({ type: "paragraph", text })),
      ...(stage.vitals.length
        ? {
            measurements: {
              timestamp: stage.timeLabel,
              values: stage.vitals.map((v) => ({ ...v, label: labels[v.id]! })),
            },
          }
        : {}),
      questions: stage.questions.map((q) => ({
        id: `${id}-q${++n}`,
        label: `Oppgave ${n}`,
        prompt: q.prompt,
      })),
    })) as CaseDefinition["parts"],
  });
}
// Explicit projection: encrypted private metadata is never returned by list/read endpoints.
export function publicDefinition(value: unknown): CaseDefinition {
  const d = value as CaseDefinition;
  return validateCase({
    id: d.id,
    title: d.title,
    ...(d.patient ? { patient: d.patient } : {}),
    ...(d.specialty ? { specialty: d.specialty } : {}),
    ...(d.background ? { background: d.background } : {}),
    ...(d.practice ? { practice: d.practice } : {}),
    parts: d.parts,
  });
}
