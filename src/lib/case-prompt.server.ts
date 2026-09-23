// Server-only. Prompt construction and JSON schemas for generated cases.
import type { CaseFormat, VarietyDraw } from "./case-variety";

export const SYSTEM_INSTRUCTIONS = `Du lager eksamenscaser i akuttmedisin for norske masterstudenter (MAKS790).
Alt du skriver er på norsk bokmål.

Casen skal teste klinisk resonnering, ikke gjenkjenning. Følg disse reglene absolutt:

PRESENTASJON FØR DIAGNOSE
- Du får utdelt en presentasjonsform. Casen starter der, ikke ved en diagnose.
- Diagnosen skal aldri nevnes i casen. Skriv aldri «mistanke om X», «sepsis», «NEWS2», «ABCDE», «triage» eller scoringer i teksten.

FORBUDT
- Lærebok-typiske hjerteinfarkt, sepsis, lungeemboli, hjerneslag, anafylaksi og diabetisk ketoacidose som fasit. Slike tilstander kan bare opptre som: (1) en fristende, men feil første hypotese, (2) en ferdigbehandlet tilleggssykdom, eller (3) en genuint uvanlig form.
- Ingen oppdiktet presisjon: ingen tall, prøvesvar eller tidspunkter som ikke naturlig ville vært kjent i situasjonen.
- Ingen fasit, ingen vurdering, ingen «riktig svar» noe sted i casen.

KRAV TIL INNHOLDET
- Minst to konkrete ikke-medisinske detaljer (bolig, jobb, dyr, transport, språk, familie, økonomi) som faktisk endrer en senere beslutning.
- Minst én opplysning som mangler og fortsatt mangler når casen slutter.
- Én genuint fristende villedende detalj.
- Vitale verdier som utvikler seg mellom målesettene, uten tolkning.
- Ordrett sitat fra pasienten eller en pårørende minst ett sted.
- Bruk samme måle-ID på tvers av deler: bp, pulse, respiration, spo2, temperature, gcs.
- Oppgavene skal be studenten vurdere, prioritere, begrunne og drøfte — ikke gjette diagnose.

Skriv tett, konkret og nøkternt, slik en journal eller vaktrapport er skrevet.`;

export function planPrompt({
  format,
  draw,
  stages,
  startSetting,
  excluded,
}: {
  format: CaseFormat;
  draw: VarietyDraw;
  stages: number;
  startSetting: string;
  excluded: string[];
}) {
  return `Lag planen for en ${format === "long" ? "lang, sammenhengende" : "kort"} case.

Faste rammer du IKKE kan endre:
- Drivkraft i casen: ${draw.engine}
- Presentasjonsform pasienten møter oss med: ${draw.presentation}
- Sted: ${draw.setting}
- Startpunkt for historien: ${startSetting}
- Pasient: ${draw.ageBand}, ${draw.sex}
- Sosial situasjon: ${draw.social}
- Ressurser: ${draw.resources}
- Tidspunkt: ${draw.time}
- ${format === "long" ? `Antall deler: ${stages}. Én pasient, én sammenhengende historie fra start til slutt.` : "Én situasjon, én vanskelig beslutning, cirka 10–15 minutters arbeid."}

Unngå disse diagnosefamiliene som fasit (studenten har hatt dem nylig eller de er forbudt):
${excluded.map((item) => `- ${item}`).join("\n")}

"dossier" er interne notater til deg selv: hva som faktisk feiler pasienten, hva som skjuler det, hvilken opplysning som mangler hele veien, og hvilken detalj som villeder. Dossieret vises aldri til studenten.
"diagnosisFamily" er ett kort stikkord for den underliggende tilstandsfamilien.
"stages" beskriver hver del kort: hvor vi er, hva som har endret seg, og hva beslutningen handler om.`;
}

export function stagePrompt({
  plan,
  index,
  total,
  format,
}: {
  plan: { title: string; patient: string; dossier: string; stages: { title: string; focus: string }[] };
  index: number;
  total: number;
  format: CaseFormat;
}) {
  const stage = plan.stages[index];
  return `Skriv del ${index + 1} av ${total} i casen «${plan.title}».

Pasient: ${plan.patient}
Interne notater (skal aldri siteres): ${plan.dossier}
Alle deler i rekkefølge: ${plan.stages.map((item, position) => `${position + 1}. ${item.title} — ${item.focus}`).join(" | ")}

Denne delen: ${stage?.title} — ${stage?.focus}

${index > 0 ? "Fortsett samme historie og samme pasient. Vitale verdier skal ha endret seg troverdig siden forrige del, med samme måle-ID-er." : "Dette er første møte med pasienten."}
${format === "long" ? "" : "Dette er en kort case: denne delen inneholder hele situasjonen."}

Skriv 1–3 oppgaver til denne delen. En del kan også være ren informasjon uten oppgaver, men casen totalt må ha oppgaver. Oppgavene merkes «Oppgave 1», «Oppgave 2» og så videre, fortløpende i hele casen (denne delen starter på oppgave ${index + 1}).
La "quote" være ordrett tale eller tom streng. La "list" stå tom hvis den ikke trengs. La "vitals.values" stå tom hvis det ikke gjøres målinger her.`;
}

const stringArray = { type: "array", items: { type: "string" } };

export const planSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "patient", "specialty", "diagnosisFamily", "dossier", "background", "stages"],
  properties: {
    title: { type: "string" },
    patient: { type: "string" },
    specialty: { type: "string" },
    diagnosisFamily: { type: "string" },
    dossier: { type: "string" },
    background: stringArray,
    stages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "shortTitle", "focus"],
        properties: {
          title: { type: "string" },
          shortTitle: { type: "string" },
          focus: { type: "string" },
        },
      },
    },
  },
};

export const stageSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "shortTitle",
    "timeLabel",
    "paragraphs",
    "quote",
    "list",
    "vitals",
    "afterParagraphs",
    "questions",
  ],
  properties: {
    title: { type: "string" },
    shortTitle: { type: "string" },
    timeLabel: { type: "string" },
    paragraphs: stringArray,
    quote: { type: "string" },
    list: {
      type: "object",
      additionalProperties: false,
      required: ["title", "items"],
      properties: { title: { type: "string" }, items: stringArray },
    },
    vitals: {
      type: "object",
      additionalProperties: false,
      required: ["timestamp", "values"],
      properties: {
        timestamp: { type: "string" },
        values: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "label", "value", "unit", "note"],
            properties: {
              id: { type: "string", enum: ["bp", "pulse", "respiration", "spo2", "temperature", "gcs"] },
              label: { type: "string" },
              value: { type: "string" },
              unit: { type: "string" },
              note: { type: "string" },
            },
          },
        },
      },
    },
    afterParagraphs: stringArray,
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "prompt", "subquestions"],
        properties: {
          label: { type: "string" },
          prompt: { type: "string" },
          subquestions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["label", "prompt"],
              properties: { label: { type: "string" }, prompt: { type: "string" } },
            },
          },
        },
      },
    },
  },
};
