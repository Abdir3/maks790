import type { GeneratedCase, QualityReview, CaseFeedback } from "../src/lib/case-contract";
import { buildDefinition } from "../src/lib/generated-case";
import { drawVariety } from "../src/lib/case-variety";
const selected = drawVariety(
  [],
  { startSetting: "legevakt", topic: "geriatrics", difficulty: "complex" },
  () => 0,
);
// This hand-written regression case has its own known clinical basis; it is not
// a clinical calibration of whichever blueprint happens to sort first.
export const draw = {
  ...selected,
  bloodGasRelevant: false,
  sourceIds: ["study-guide", "assignment-2", "geriatrics"],
};
export const reviewed: QualityReview = {
  coherent: true,
  clinicallyPlausible: true,
  fair: true,
  noDiagnosticLeak: true,
  sourcesWithinScope: true,
  matchesBlueprint: true,
  meaningfullyDifferent: true,
  rubricAcceptsAlternatives: true,
  noUnsupportedHighRiskAdvice: true,
  issues: [],
};
export function generatedFixture(count = 3): GeneratedCase {
  return {
    patient: "Liv, 79 år",
    ageYears: 79,
    role: "Du arbeider som avansert klinisk sykepleier og deltar i vurdering og oppfølging.",
    background: [
      "Bor med ektefelle og er vanligvis selvhjulpen. Har hypertensjon og bruker amlodipin. Legemiddellisten er ikke samstemt; ingen kjente allergier oppgis.",
      "Går uten hjelpemidler og ivaretar vanligvis egne legemidler. Ingen kjent kognitiv svikt. Ektefellen oppgir ingen andre faste legemidler, men kan ikke bekrefte inntaket det siste døgnet.",
    ],
    diagnosisFamily: "akutt funksjonssvikt",
    diagnosisAliases: ["hypoaktivt delirium"],
    mechanism: "Akutt endret oppmerksomhet ved redusert væskeinntak, med mulig legemiddelbidrag.",
    presentation: "Eldre kvinne med redusert matinntak og endring fra tidligere funksjon.",
    reasoningTarget:
      "Koble tidsforløp, komparentopplysninger og funksjon til behov for bred vurdering og oppfølging.",
    pivotalFindings: [
      "Ny endring i oppmerksomhet og funksjon.",
      "Redusert inntak og usikkert legemiddelinntak.",
    ],
    dossier:
      "Endret oppmerksomhet krever bred vurdering. Dehydrering og legemiddeleffekt er aktuelle forklaringer. Ingen bekreftet etiologisk diagnose.",
    stages: Array.from({ length: count }, (_, i) => ({
      setting: i === 0 ? "Legevakt" : i === 1 ? "Kommunal akutt døgnenhet" : "Akuttmottak",
      elapsedMinutes: i * 90,
      timeLabel: `Dag 1, ${15 + i}:00`,
      paragraphs: [
        i === 0
          ? "Ektefellen beskriver redusert matlyst siden i går. Liv svarer langsomt og vil hjem. Hun kan ikke forklare når hun sist tok legemidlene sine."
          : i === 1
            ? "Ved ny observasjon trenger hun hjelp for å gå til toalettet. Hun har drukket lite. Ektefellen kan ikke bistå om natten."
            : "Ny informasjon: hun er vanskeligere å holde våken. Familien beskriver dette som en tydelig endring. Lege tilkalles for ny vurdering.",
      ],
      clinicalFindings: [
        "Varm perifert, tørre slimhinner. Ingen synlig respirasjonsbesvær. Svarer langsomt på spørsmål.",
      ],
      medications: [],
      laboratory: [],
      bloodGas: [],
      reports: [],
      vitals: [
        { id: "bp", value: i === 0 ? "138/80" : "118/70", unit: "mmHg", note: "" },
        { id: "respiration", value: `${18 + i * 3}`, unit: "/min", note: "" },
        { id: "spo2", value: `${96 - i}`, unit: "%", note: "Romluft" },
        { id: "pulse", value: `${82 + i * 5}`, unit: "/min", note: "Regelmessig" },
        { id: "temperature", value: "37,3", unit: "°C", note: "Tympanisk" },
        {
          id: "gcs",
          value: `${15 - (i > 1 ? 1 : 0)}`,
          unit: "/15",
          note: i > 1 ? "E3 V5 M6" : "E4 V5 M6",
        },
      ],
      questions: [
        {
          prompt:
            i === 0
              ? "Hvilke opplysninger vil du innhente først, og hvordan begrunner du prioriteringen?"
              : i === 1
                ? "Hvilke vilkår må være oppfylt for en forsvarlig overgang til hjemmet? Begrunn vurderingen."
                : "Hvordan endrer de nye funnene din vurdering, og hvilke tiltak vil du prioritere nå?",
          skill: i === 0 ? "assessment" : i === 1 ? "disposition" : "reassessment",
          temporalScope: "at-time",
          rubric: {
            expected: [
              "Knytt endret oppmerksomhet til tidligere funksjon og innhent komparentopplysninger.",
              "Forklar behov for ny vurdering ved endring og avklar hvem som følger opp.",
            ],
            alternatives: [
              "Videre observasjon kan begrunnes dersom nødvendig kompetanse og mulighet for rask eskalering er tilgjengelig.",
            ],
            critical: [
              "Hjemreise uten vurdering av ny funksjonssvikt krever særskilt begrunnelse.",
            ],
            sourceIds: ["assignment-2", "geriatrics"],
          },
        },
      ],
    })),
  };
}
export const generatedDefinition = buildDefinition(
  "gen-00000000-0000-4000-8000-000000000001",
  generatedFixture(),
  draw,
);
export function feedbackFixture(
  questionId: string,
  answer = "Jeg vil innhente komparentopplysninger.",
): CaseFeedback {
  return {
    summary:
      "Du knytter prioriteringen til pasientens funksjon. Utdyp hva som vil endre vurderingen.",
    questions: [
      {
        questionId,
        status: answer ? "partial" : "unanswered",
        evidence: answer,
        strengths: answer ? ["Du vil avklare endring fra tidligere funksjon."] : [],
        improvements: ["Beskriv hvilke observasjoner som bør føre til eskalering."],
        alternatives: [
          "Observasjon kan være forsvarlig med tydelig ansvar og mulighet for rask eskalering.",
        ],
        safety: [],
        nextStep: "Skriv en kort begrunnelse for hvem du vil kontakte og hvorfor.",
        sourceIds: ["assignment-2", "geriatrics"],
      },
    ],
  };
}
