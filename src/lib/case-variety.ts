// Compatible curriculum blueprints; demographics alone do not count as novelty.
export type CaseFormat = "long" | "quick";
export const DIFFICULTIES = ["advanced", "complex"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const START_SETTINGS = [
  { id: "auto", label: "Varier startsted" },
  { id: "hjem", label: "Hjemme / ambulanse" },
  { id: "sykehjem", label: "Sykehjem" },
  { id: "fastlege", label: "Fastlegekontor" },
  { id: "legevakt", label: "Legevakt" },
  { id: "mottak", label: "Akuttmottak" },
  { id: "sengepost", label: "Sengepost" },
  { id: "kad", label: "Kommunal akutt døgnenhet" },
  { id: "telefon", label: "Telefonhenvendelse til AMK" },
] as const;
export type SettingId = (typeof START_SETTINGS)[number]["id"];
type Topic = {
  id: string;
  label: string;
  minAge: number;
  maxAge: number;
  patterns: readonly string[];
  sources: readonly string[];
};
export const TOPICS: readonly Topic[] = [
  {
    id: "circulation",
    label: "Sirkulasjon og respirasjon",
    minAge: 18,
    maxAge: 90,
    patterns: [
      "tungpust med konkurrerende hjerte- og lungeforklaring",
      "brystsmerter med uavklart hastegrad",
      "synkope med usikker rytmeårsak",
    ],
    sources: ["study-guide", "respiration", "syncope", "deterioration"],
  },
  {
    id: "infection",
    label: "Infeksjon og sjokk",
    minAge: 18,
    maxAge: 90,
    patterns: [
      "mulig infeksjon uten tydelig fokus",
      "sirkulasjonssvikt med flere mulige mekanismer",
      "forverring etter foreløpig betryggende vurdering",
    ],
    sources: ["study-guide", "first-actions"],
  },
  {
    id: "pediatrics",
    label: "Akutt syke barn og prioritering",
    minAge: 0,
    maxAge: 15,
    patterns: [
      "prioritering av flere barn på venterommet",
      "foreldre beskriver endret kontakt og væskeinntak",
      "smerter med lite spesifikke funn hos barn",
    ],
    sources: ["assignment-1", "pediatrics"],
  },
  {
    id: "geriatrics",
    label: "Geriatri, funksjon og omsorgsnivå",
    minAge: 70,
    maxAge: 95,
    patterns: [
      "akutt funksjonsfall med uavklart årsak",
      "trygg utskrivelse etter skade",
      "endret oppmerksomhet og ufullstendig legemiddelliste",
    ],
    sources: ["assignment-2", "geriatrics", "syncope", "hip-injury", "deterioration"],
  },
  {
    id: "trauma-neuro",
    label: "Traumer og nevrologi",
    minAge: 16,
    maxAge: 90,
    patterns: [
      "hodeskade med samtidige alternative forklaringer",
      "nevrologiske symptomer som endrer seg over tid",
      "distraherende ekstremitetsskade etter ulykke",
    ],
    sources: ["study-guide", "first-actions"],
  },
  {
    id: "metabolic",
    label: "Endokrinologi, væske og syre-base",
    minAge: 18,
    maxAge: 85,
    patterns: [
      "allmennpåvirkning og metabolsk forstyrrelse",
      "kvalme med legemiddelrelatert risiko",
      "svakhet og væskebalanse med uklart utgangspunkt",
    ],
    sources: ["endocrine", "fluid-balance"],
  },
  {
    id: "abdomen",
    label: "Akutte abdominale tilstander",
    minAge: 16,
    maxAge: 90,
    patterns: [
      "magesmerter med usikker tidskritikalitet",
      "oppkast og smerter som krever ny prioritering",
      "abdominale symptomer og samtidig organsykdom",
    ],
    sources: ["study-guide", "first-actions", "deterioration"],
  },
  {
    id: "mental-health",
    label: "Psykisk helse og somatisk risiko",
    minAge: 15,
    maxAge: 70,
    patterns: [
      "allianse og sikkerhet etter selvskading",
      "somatiske komplikasjoner ved spiseforstyrrelse",
      "psykiske symptomer med mulig somatisk forklaring",
    ],
    sources: [
      "self-harm",
      "suicidality",
      "assignment-1",
      "eating-disorders",
      "qt-risk",
      "decision-capacity",
    ],
  },
  {
    id: "substance",
    label: "Rus, intoksikasjon og smerter",
    minAge: 18,
    maxAge: 80,
    patterns: [
      "smerter hos pasient i LAR",
      "uavklart inntak og trygg overgang etter observasjon",
      "alkoholbruk og samtidig akutt sykdom",
    ],
    sources: ["assignment-1", "substance"],
  },
  {
    id: "treatment-limits",
    label: "Behandlingsavklaring og pårørende",
    minAge: 40,
    maxAge: 95,
    patterns: [
      "mulig reversibel forverring ved alvorlig grunnsykdom",
      "behandlingsmål og pårørendes bekymring",
      "ivaretakelse av voksne og barn ved brå død",
    ],
    sources: ["assignment-1", "bereavement", "treatment-goals", "decision-capacity"],
  },
  {
    id: "safeguarding",
    label: "Vold, samtykke og kommunikasjon",
    minAge: 18,
    maxAge: 80,
    patterns: [
      "pasient ønsker hjem etter vold",
      "språkbarriere og usikker overlevering",
      "uenighet om helsehjelp og beslutningskompetanse",
    ],
    sources: ["assignment-1", "communication", "decision-capacity"],
  },
  {
    id: "oncology",
    label: "Behandlingskomplikasjoner",
    minAge: 30,
    maxAge: 85,
    patterns: [
      "nye symptomer etter kreftbehandling",
      "smerter og uventet behandlingsrespons",
      "polyfarmasi og mulig iatrogen forverring",
    ],
    sources: ["assignment-1", "study-guide", "first-actions", "deterioration", "substance"],
  },
];
export const DECISIONS = [
  "prioritere og begrunne hastegrad",
  "veie differensialer og velge avklarende undersøkelser",
  "begrunne tiltak og overvåking",
  "revurdere etter ny informasjon",
  "planlegge forsvarlig overgang og sikkerhetsnett",
  "kommunisere og avveie etiske hensyn",
] as const;
export const TRAJECTORIES = [
  "gradvis forverring",
  "delvis bedring med vedvarende usikkerhet",
  "stabil tilstand med viktig ny informasjon",
  "svingende symptomer",
  "uventet respons på tiltak",
] as const;
export type HistoryEntry = {
  engine: string;
  presentation: string;
  setting: string;
  diagnosis_family: string | null;
};
export type VarietyDraw = {
  topicId: string;
  topic: string;
  pattern: string;
  decision: string;
  trajectory: string;
  minAge: number;
  maxAge: number;
  setting: string;
  settingId: SettingId;
  sourceIds: string[];
  difficulty: Difficulty;
  fingerprint: string;
};
function choose<T>(items: readonly T[], random: () => number): T {
  if (!items.length) throw new Error("Ingen kompatibel casekombinasjon.");
  return items[Math.min(items.length - 1, Math.floor(Math.max(0, random()) * items.length))]!;
}
export function drawVariety(
  history: HistoryEntry[],
  options: { startSetting: SettingId; difficulty: Difficulty; topic?: string },
  random = Math.random,
): VarietyDraw {
  const compatible = TOPICS.filter(
    (t) =>
      (!options.topic || options.topic === "auto" || t.id === options.topic) &&
      (options.startSetting !== "sykehjem" || t.maxAge >= 70) &&
      (options.startSetting !== "kad" || t.maxAge >= 18),
  );
  const minimum = Math.min(
    ...compatible.map((t) => history.filter((h) => h.presentation === t.id).length),
  );
  const topic = choose(
    compatible.filter((t) => history.filter((h) => h.presentation === t.id).length === minimum),
    random,
  );
  const settings = START_SETTINGS.filter(
    (s) =>
      s.id !== "auto" &&
      (topic.maxAge >= 70 || s.id !== "sykehjem") &&
      (topic.maxAge >= 18 || s.id !== "kad"),
  );
  const setting =
    options.startSetting === "auto"
      ? choose(
          settings.filter((s) => s.id !== history[0]?.setting),
          random,
        )
      : settings.find((s) => s.id === options.startSetting);
  if (!setting) throw new Error("Temaet passer ikke til valgt startsted.");
  const candidates = topic.patterns.flatMap((pattern) =>
    (pattern.includes("brå død") ? [DECISIONS[4], DECISIONS[5]] : DECISIONS).flatMap((decision) =>
      (pattern.includes("brå død") ? [TRAJECTORIES[2]] : TRAJECTORIES).map((trajectory) => ({
        pattern,
        decision,
        trajectory,
        fingerprint: [topic.id, pattern, decision, trajectory].join("|"),
      })),
    ),
  );
  const novel = candidates.filter(
    (c) => !history.some((h) => h.diagnosis_family === c.fingerprint),
  );
  const pool = novel.length ? novel : candidates;
  const balanced = pool.filter((c) => !history.slice(0, 2).some((h) => h.engine === c.decision));
  const selected = choose(balanced.length ? balanced : pool, random);
  return {
    ...selected,
    topicId: topic.id,
    topic: topic.label,
    minAge:
      setting.id === "sykehjem"
        ? Math.max(70, topic.minAge)
        : setting.id === "kad"
          ? Math.max(18, topic.minAge)
          : topic.minAge,
    maxAge: topic.maxAge,
    setting: setting.label,
    settingId: setting.id,
    sourceIds: [...topic.sources],
    difficulty: options.difficulty,
  };
}
