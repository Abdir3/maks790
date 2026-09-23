// The variety rules. The combination is drawn in code, never left to the model,
// so repeats can be detected and blocked against a user's history.

export type CaseFormat = "long" | "quick";

export const ENGINES = [
  "Forverring som overses hos en pasient innlagt for noe annet",
  "Riktig diagnose, men feil disposisjon eller omsorgsnivå",
  "To tilstander samtidig, der behandling av den ene forverrer den andre",
  "Riktig diagnose, feil sted eller feil ressurser",
  "Samtykkekompetanse, nekting, pårørende, tvang",
  "Informasjonssvikt: rapport, medisinliste, språk, ingen sykehistorie",
  "Ressurskonflikt: to pasienter, én ambulanse, én seng, én sykepleier",
  "Vanlig tilstand med atypisk presentasjon",
  "Atypisk populasjon: svært gammel, gravid, alvorlig overvektig, utviklingshemmet, ruspåvirket, skrøpelig",
  "Iatrogent: behandlingen forårsaket dette",
  "Usikkerhet som aldri lar seg avklare — casen ender uten diagnose",
] as const;

export const PRESENTATIONS = [
  "forvirring",
  "gjentatte fall",
  "slapphet og redusert allmenntilstand",
  "magesmerter",
  "tungpust",
  "«hun er ikke seg selv»",
  "feber uten åpenbart fokus",
  "uro og aggresjon",
  "kvalme og oppkast",
  "smerte som ikke gir seg",
  "besvimelse",
  "hudforandring eller sår som forverres",
  "ingenting konkret, men familien insisterer",
  "vegring mot å spise eller drikke",
  "nedsatt bevegelighet i én ekstremitet",
] as const;

export const SETTINGS = [
  "hjemme i egen bolig",
  "sykehjem",
  "arbeidsplass",
  "veikant / trafikkulykke",
  "fastlegekontor",
  "legevakt",
  "sengepost på sykehus",
  "kommunal akutt døgnenhet",
  "ferge eller båt",
  "skole eller barnehage",
  "festival eller idrettsarrangement",
  "hytte langt fra vei",
  "asylmottak eller bofellesskap",
] as const;

export const START_SETTINGS = [
  { id: "hjem", label: "Hjemme / ambulanse" },
  { id: "sykehjem", label: "Sykehjem" },
  { id: "fastlege", label: "Fastlegekontor" },
  { id: "legevakt", label: "Legevakt" },
  { id: "sengepost", label: "Sengepost" },
  { id: "telefon", label: "Telefonhenvendelse til AMK" },
] as const;

export const AGE_BANDS = [
  "spedbarn",
  "barn 4–10 år",
  "ungdom 13–17 år",
  "ung voksen 18–30 år",
  "voksen 31–50 år",
  "voksen 51–65 år",
  "eldre 66–79 år",
  "svært gammel 80–95 år",
] as const;

export const SOCIAL = [
  "bor alene uten nettverk",
  "bor alene, pårørende langt unna",
  "bor med ektefelle som selv er syk",
  "småbarnsfamilie",
  "bor i bofellesskap med personale",
  "nylig flyttet, snakker lite norsk",
  "hjemmetjeneste to ganger daglig",
  "under barnevernets omsorg",
  "uten fast bopel",
] as const;

export const RESOURCES = [
  "én ambulanse, lang transporttid",
  "legevakt med bildediagnostikk tilgjengelig",
  "legevakt uten bildediagnostikk",
  "nattevakt alene med mange pasienter",
  "fullt akuttmottak, ingen ledige senger",
  "helikopter ikke tilgjengelig på grunn av vær",
  "vanlig bemanning, ingen spesielle begrensninger",
] as const;

export const TIMES = [
  "tidlig morgen på en hverdag",
  "midt på dagen fredag",
  "fredag ettermiddag",
  "lørdag kveld",
  "natt til søndag",
  "helligdag",
  "midt i vaktskifte",
] as const;

// Never the clean headline answer.
export const EXCLUDED_HEADLINES = [
  "lærebok-typisk STEMI",
  "lærebok-typisk sepsis",
  "lærebok-typisk lungeemboli",
  "lærebok-typisk hjerneslag",
  "lærebok-typisk anafylaksi",
  "lærebok-typisk diabetisk ketoacidose",
];

export type VarietyDraw = {
  engine: string;
  presentation: string;
  setting: string;
  ageBand: string;
  sex: string;
  social: string;
  resources: string;
  time: string;
  patientProfile: string;
};

export type HistoryEntry = {
  engine: string;
  presentation: string;
  setting: string;
  diagnosis_family: string | null;
};

function pick<T>(list: readonly T[], avoid: ReadonlySet<unknown> = new Set()): T {
  const open = list.filter((item) => !avoid.has(item));
  const pool = open.length > 0 ? open : list;
  return pool[Math.floor(Math.random() * pool.length)] as T;
}

export function drawVariety(history: HistoryEntry[], format: CaseFormat): VarietyDraw {
  const recent = history.slice(0, format === "long" ? 8 : 12);
  const engine = pick(
    ENGINES,
    new Set(recent.slice(0, 3).map((item) => item.engine)),
  );
  const presentation = pick(
    PRESENTATIONS,
    new Set(recent.map((item) => item.presentation)),
  );
  const setting = pick(SETTINGS, new Set(recent.slice(0, 4).map((item) => item.setting)));
  const ageBand = pick(AGE_BANDS);
  const sex = pick(["kvinne", "mann"] as const);
  const social = pick(SOCIAL);
  const resources = pick(RESOURCES);
  const time = pick(TIMES);
  return {
    engine,
    presentation,
    setting,
    ageBand,
    sex,
    social,
    resources,
    time,
    patientProfile: `${ageBand}, ${sex}, ${social}`,
  };
}

export function excludedDiagnoses(history: HistoryEntry[]) {
  return [
    ...EXCLUDED_HEADLINES,
    ...history
      .map((item) => item.diagnosis_family)
      .filter((value): value is string => Boolean(value))
      .slice(0, 20),
  ];
}
