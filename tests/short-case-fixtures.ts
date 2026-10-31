import type { GeneratedCase } from "../src/lib/case-contract";
import { drawVariety } from "../src/lib/case-variety";

// Hand-written data exercise serialization and delivery, not a model benchmark.
export const shortCaseDraw = drawVariety(
  [],
  {
    startSetting: "mottak",
    difficulty: "advanced",
    topic: "metabolic",
    blueprintId: "dka",
    format: "quick",
  },
  () => 0,
);

export function shortCaseFixture(): GeneratedCase {
  return {
    patient: "Marius Berg",
    ageYears: 32,
    role: "Du er avansert klinisk sykepleier i akuttmottaket. Lege er tilgjengelig, og dere vurderer pasienten sammen.",
    background: [
      "Type 1-diabetes siden ungdomsårene. Ingen kjent nyre- eller hjertesykdom. Bor alene og håndterer vanligvis insulin selv. Ingen kjente legemiddelallergier.",
    ],
    diagnosisFamily: shortCaseDraw.diagnosisFamily,
    diagnosisAliases: ["diabetisk ketoacidose"],
    mechanism: "Insulinmangel etter utelatte doser gir ketogenese, osmotisk diurese og væsketap.",
    presentation: "Tørste, oppkast og rask pust etter manglende insulin.",
    reasoningTarget:
      "Koble blodgass og ketoner til insulinmangel, og forklare behov for samlet væske-, glukose- og kaliumoppfølging.",
    pivotalFindings: [
      "Utelatt insulin og væsketap",
      "Acidemi, ketonemi og hyperglykemi",
      "Kalium må tolkes sammen med insulinmangel og nyrefunksjon",
    ],
    dossier:
      "Funnene støtter diabetisk ketoacidose etter insulinmangel. Kaliumverdien utelukker ikke total kaliumdeplesjon. Sultketose er et alternativ, men forklarer funnene dårligere i denne sammenhengen.",
    stages: [
      {
        setting: shortCaseDraw.setting,
        elapsedMinutes: 0,
        timeLabel: "Ved første vurdering",
        paragraphs: [
          "Marius kommer med ett døgns tiltagende tørste, kvalme og rask pust. Han har kastet opp fire ganger, drukket lite og urinert mye. Han har unnlatt insulin fordi han ikke har spist. Han benekter feber, hoste, dysuri, alkohol og andre rusmidler.",
          "Han er våken og orientert, men sliten. Han beskriver diffuse magesmerter uten diaré. Det foreligger ingen nye legemidler eller kjent forgiftning. Prøvene nedenfor er tatt ved ankomst, før behandling.",
        ],
        clinicalFindings: [
          "Tørre slimhinner og redusert hudturgor.",
          "Dyp, regelmessig respirasjon; rene lungelyder bilateralt.",
          "Bløt buk med lett diffus ømhet, uten slippømhet.",
        ],
        medications: [
          {
            name: "Insulin glargin",
            activeIngredient: "insulin glargin",
            dose: "22 enheter",
            route: "subkutant",
            schedule: "Fast hver kveld; siste planlagte dose utelatt",
            context: "reported",
            timeMinutes: -2160,
            sourceIds: ["endocrine"],
          },
          {
            name: "Insulin aspart",
            activeIngredient: "insulin aspart",
            dose: "6 enheter",
            route: "subkutant",
            schedule: "Til måltid; ingen doser siden siste inntak",
            context: "reported",
            timeMinutes: -1440,
            sourceIds: ["endocrine"],
          },
        ],
        laboratory: [
          ["glucose", "Glukose", "25", "mmol/L", "4,0–6,0", "Plasma"],
          ["ketones", "β-hydroksybutyrat", "5,8", "mmol/L", "<0,6", "Blod"],
          ["sodium", "Natrium", "133", "mmol/L", "137–145", "Plasma"],
          ["potassium", "Kalium", "5,2", "mmol/L", "3,5–4,6", "Plasma"],
          ["chloride", "Klorid", "99", "mmol/L", "98–107", "Plasma"],
          ["albumin", "Albumin", "42", "g/L", "36–48", "Plasma"],
          ["creatinine", "Kreatinin", "118", "µmol/L", "60–105", "Plasma"],
          ["urea", "Karbamid", "9,6", "mmol/L", "3,2–8,1", "Plasma"],
          ["lactate", "Laktat", "1,5", "mmol/L", "0,5–2,2", "Blod"],
          ["crp", "CRP", "7", "mg/L", "<5", "Plasma"],
        ].map(([id, label, value, unit, referenceRange, sampleType]) => ({
          id: id!,
          label: label!,
          value: value!,
          unit: unit!,
          referenceRange: referenceRange!,
          sampleType: sampleType!,
          timeMinutes: 0,
        })),
        bloodGas: [
          {
            sampleType: "arterial",
            sampledAt: "Ved ankomst",
            oxygen: "Romluft",
            pH: 7.2,
            pCO2: 2.9,
            pO2: 12.5,
            timeMinutes: 0,
          },
        ],
        reports: [
          {
            kind: "ecg",
            timeMinutes: 0,
            findings:
              "Sinusrytme 112/min, smale QRS-komplekser. Ingen akutte ST-forandringer eller uttalte T-bølgeforandringer.",
            conclusion:
              "Sinustakykardi uten akutte iskemiske funn eller tydelige hyperkalemiforandringer.",
          },
        ],
        vitals: [
          { id: "bp", value: "106/68", unit: "mmHg", note: "" },
          { id: "pulse", value: "112", unit: "/min", note: "Regelmessig" },
          { id: "respiration", value: "28", unit: "/min", note: "Dyp" },
          { id: "spo2", value: "97", unit: "%", note: "Romluft" },
          { id: "temperature", value: "37,2", unit: "°C", note: "" },
          { id: "gcs", value: "15", unit: "", note: "E4 V5 M6" },
          { id: "weight", value: "78", unit: "kg", note: "Målt" },
        ],
        questions: [
          {
            prompt:
              "Tolk blodgassen sammen med øvrige prøver. Hva er mest sannsynlig forklaring, og hvilke funn skiller den fra et relevant alternativ?",
            skill: "differential",
            temporalScope: "at-time",
            rubric: {
              expected: [
                "Koble acidemi og lavt beregnet bikarbonat til metabolsk acidose med respiratorisk kompensasjon.",
                "Begrunn ketoacidose med ketoner, hyperglykemi, insulinmangel og væsketap.",
              ],
              alternatives: [
                "Sultketose kan bidra etter lite matinntak; uttalt hyperglykemi og utelatt insulin støtter diabetisk ketoacidose sterkere.",
              ],
              critical: ["Rask pust må vurderes som mulig kompensasjon for metabolsk acidose."],
              sourceIds: ["endocrine", "fluid-balance"],
            },
          },
          {
            prompt:
              "Hvilke observasjoner og prøver må følges sammen under den videre håndteringen, og hvorfor er kaliumverdien og EKG-et utilstrekkelige alene?",
            skill: "prioritisation",
            temporalScope: "at-time",
            rubric: {
              expected: [
                "Knytt oppfølging av sirkulasjon, diurese, glukose, ketoner og syre-base til respons og risiko ved tilstanden.",
                "Forklar at insulinmangel og acidose påvirker kaliumfordelingen; en høy startverdi viser ikke samlet kaliumreserve.",
              ],
              alternatives: [
                "Omfang og hyppighet av overvåking tilpasses klinisk utvikling og lokale prosedyrer i samarbeid med lege.",
              ],
              critical: [
                "Et EKG uten typiske kaliumforandringer erstatter ikke gjentatte elektrolyttmålinger.",
              ],
              sourceIds: ["endocrine", "fluid-balance"],
            },
          },
        ],
      },
    ],
  };
}
