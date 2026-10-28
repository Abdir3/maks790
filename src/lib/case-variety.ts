// Coverage is a teaching design, not a prediction of official exam frequencies.
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
type ConcreteSetting = Exclude<SettingId, "auto">;
export const DECISIONS = [
  "prioritere og begrunne hastegrad",
  "veie differensialer ut fra oppgitte funn og prøvesvar",
  "begrunne tiltak og overvåking",
  "revurdere oppgitte funn og behandlingsrespons",
  "planlegge forsvarlig overgang og sikkerhetsnett",
  "kommunisere og avveie etiske hensyn",
] as const;
export const TRAJECTORIES = [
  "gradvis forverring med eksplisitte måletidspunkter",
  "delvis bedring med gjenværende klinisk problem",
  "stabil tilstand med komplett diagnostisk vurderingsgrunnlag",
  "svingende symptomer med oppgitt tidslinje",
  "oppgitt behandlingsrespons som krever revurdering",
] as const;
export type ReasoningFocus = {
  id: string;
  label: string;
  decision: (typeof DECISIONS)[number];
  pivotalEvidence: readonly string[];
};
export type ClinicalBlueprint = {
  id: string;
  topicId: string;
  diagnosisFamily: string;
  mechanism: string;
  presentation: string;
  reasoningTargets: readonly ReasoningFocus[];
  requiredData: readonly string[];
  holisticFocus: readonly string[];
  sourceIds: readonly string[];
  minAge: number;
  maxAge: number;
  settings: readonly ConcreteSetting[];
  formats: readonly CaseFormat[];
  bloodGasRelevant: boolean;
  trajectories: readonly string[];
};
const hospital: readonly ConcreteSetting[] = ["mottak", "sengepost"];
const gasSettings: readonly ConcreteSetting[] = ["legevakt", ...hospital];
const faceToFace: readonly ConcreteSetting[] = [
  "hjem",
  "fastlege",
  "legevakt",
  ...hospital,
  "kad",
  "sykehjem",
];
const ambulatory: readonly ConcreteSetting[] = ["hjem", "fastlege", "legevakt", "mottak"];
const completeData = [
  "Relevant sykehistorie, grunnfunksjon, tidslinje og kliniske positive/negative funn",
  "Full relevant medikamenthistorikk: navn, dose, enhet, administrasjonsmåte, hyppighet, siste inntak, endringer og allergier",
  "Alle relevante vitalia og prøvesvar som oppgaven trenger, med enheter, referanser og tidspunkt; ingen avgjørende opplysninger holdes tilbake",
  "EKG gis som klinisk tolket rapport når relevant; blodgass gis som tall studenten selv tolker",
];
type Options = Partial<
  Pick<
    ClinicalBlueprint,
    | "minAge"
    | "maxAge"
    | "settings"
    | "formats"
    | "bloodGasRelevant"
    | "holisticFocus"
    | "trajectories"
  >
> & { secondDecision?: (typeof DECISIONS)[number] };
function b(
  id: string,
  topicId: string,
  diagnosisFamily: string,
  mechanism: string,
  presentation: string,
  evidence: string[],
  target: string,
  applied: string,
  sourceIds: string[],
  options: Options = {},
): ClinicalBlueprint {
  const gas = options.bloodGasRelevant ?? false;
  return {
    id,
    topicId,
    diagnosisFamily,
    mechanism,
    presentation,
    reasoningTargets: [
      { id: "diagnostic", label: target, decision: DECISIONS[1], pivotalEvidence: evidence },
      {
        id: "applied",
        label: applied,
        decision: options.secondDecision ?? DECISIONS[2],
        pivotalEvidence: evidence,
      },
    ],
    requiredData: [
      ...completeData,
      ...evidence,
      ...(gas
        ? [
            "Påkrevd blodgass: prøvetype, tidspunkt, oksygenkontekst, pH, pCO₂ og pO₂; aktuelt HCO₃⁻ og SBE(Ecf) beregnes av systemet",
          ]
        : []),
    ],
    holisticFocus: options.holisticFocus ?? [
      "Legemidler og komorbiditet i lys av akutt sykdom",
      "Pasientens forståelse, funksjon og videre oppfølging",
    ],
    sourceIds: [
      ...new Set([
        "study-guide",
        ...sourceIds,
        ...(gas ? ["fluid-balance", "blood-gas-method", "blood-gas-reference"] : []),
      ]),
    ],
    minAge: options.minAge ?? 18,
    maxAge: options.maxAge ?? 90,
    settings: options.settings ?? (gas ? gasSettings : faceToFace),
    formats: options.formats ?? ["quick", "long"],
    bloodGasRelevant: gas,
    trajectories: options.trajectories ?? TRAJECTORIES,
  };
}
// Real mechanisms and case-specific evidence are paired deliberately. These are
// not arbitrary combinations of a generic presentation and a generic decision.
export const CLINICAL_BLUEPRINTS: readonly ClinicalBlueprint[] = [
  b(
    "acs",
    "circulation",
    "akutt-koronarsyndrom",
    "koronar iskemi med myokardskade",
    "brystsmerter eller atypisk tungpust",
    [
      "Symptomdebut og utvikling",
      "Tolket EKG og tidsfestede serielle troponiner med lokal metode/referanse",
      "Hemoglobin, nyrefunksjon og sirkulasjonsfunn",
    ],
    "Skille iskemisk myokardskade fra andre årsaker til troponinstigning",
    "Begrunne tidskritisk håndtering av sannsynlig koronarsykdom",
    ["troponin", "geriatrics", "deterioration"],
    { settings: hospital, secondDecision: DECISIONS[0] },
  ),
  b(
    "heart-failure",
    "circulation",
    "akutt-hjertesvikt",
    "pulmonal stuvning ved pumpesvikt",
    "økende tungpust og væskeproblemer",
    [
      "Ortopné, ødemer, vekt og lungefunn",
      "Tolket EKG, røntgen, NT-proBNP og nyrefunksjon",
      "Arteriell blodgass med oksygentilførsel",
    ],
    "Integrere stuvningsfunn og hjertemarkører uten å gjøre ett funn diagnostisk",
    "Avveie stuvning, nyrefunksjon og legemiddelbruk",
    ["geriatrics", "respiration", "deterioration"],
    { bloodGasRelevant: true },
  ),
  b(
    "pulmonary-embolism",
    "circulation",
    "lungeemboli",
    "obstruksjon i lungekretsløpet",
    "akutt tungpust eller synkope",
    [
      "Debut, tromboserisiko og hemodynamikk",
      "D-dimer med referanse når relevant og full CT-pulmonalisrapport",
      "Tolket EKG, blodgass og eventuell ekkorapport",
    ],
    "Vurdere embolimistanke med pretestsannsynlighet og oppgitte undersøkelser",
    "Skille sirkulatorisk belastning fra oksygeneringsproblem",
    ["pulmonary-embolism", "respiration"],
    { settings: hospital, bloodGasRelevant: true },
  ),
  b(
    "copd",
    "circulation",
    "kolsforverring",
    "akutt ventilasjonssvikt på kronisk obstruksjon",
    "økende tungpust og endret våkenhet",
    [
      "Habituell funksjon/metning og aktuell respirasjonsinnsats",
      "Tidsfestede blodgasser før/etter oppgitt tiltak",
      "Oksygen, inhalasjonsmedisiner, infeksjonsfunn og røntgensvar",
    ],
    "Skille oksygenering fra ventilasjon og akutt fra kronisk komponent",
    "Revurdere ventilasjon selv om oksygenmetningen bedres",
    ["copd-current", "respiration"],
    { minAge: 40, bloodGasRelevant: true, secondDecision: DECISIONS[3] },
  ),
  b(
    "asthma",
    "circulation",
    "akutt-astma",
    "luftveisobstruksjon med risiko for utmattelse",
    "tiltagende pustearbeid ved astma",
    [
      "Taleevne, auskultasjon, respirasjonsinnsats og behandlingshistorie",
      "Tidsfestet blodgass, oksygentilførsel og respons",
    ],
    "Tolke pCO₂ i sammenheng med pustearbeid og utvikling",
    "Begrunne ventilasjonsvurdering ved utmattelse",
    ["respiration", "first-actions"],
    { bloodGasRelevant: true },
  ),
  b(
    "arrhythmic-syncope",
    "circulation",
    "arytmirelatert-synkope",
    "forbigående redusert cerebral perfusjon ved rytmeforstyrrelse",
    "kort bevissthetstap med vitnebeskrivelse",
    [
      "Aktivitet, prodromer og restitusjon",
      "Tolket EKG/rytmerapport",
      "Legemidler, elektrolytter og relevant familiehistorie",
    ],
    "Skille arytmirelatert synkope fra vasovagal episode og anfall",
    "Begrunne overvåking og legemiddelgjennomgang ved rytmerisiko",
    ["syncope", "qt-risk", "fluid-balance"],
  ),
  b(
    "orthostasis",
    "circulation",
    "ortostatisk-synkope",
    "volumtap og medikamenteffekt ved stillingsendring",
    "svimmelhet eller fall etter redusert inntak",
    [
      "Stillingsrelasjon og vitnebeskrivelse",
      "Blodtrykksserie tatt når forsvarlig",
      "Væsketap, hemoglobin, nyrefunksjon og dosefestet medisinliste",
    ],
    "Sammenholde utløsende situasjon og sirkulasjonsfunn uten å overse annen sykdom",
    "Planlegge trygg overgang og medikamentvurdering",
    ["syncope", "geriatrics", "fluid-balance"],
    { secondDecision: DECISIONS[4] },
  ),
  b(
    "pneumonia-sepsis",
    "infection",
    "sepsis",
    "infeksjonsutløst organsvikt fra lungefokus",
    "luftveissymptomer og endret sirkulasjon eller kontakt",
    [
      "Komplette vitalia og sykdomsforløp",
      "Lungefunn og røntgenrapport",
      "Blodgass, laktat, nyrefunksjon, hematologi og relevante mikrobiologiske svar",
    ],
    "Identifisere organsvikt uten qSOFA eller CRP alene som diagnose",
    "Prioritere infeksjonsbehandling og organstøtte etter alvorlighet",
    ["sepsis-current", "respiration"],
    { bloodGasRelevant: true, secondDecision: DECISIONS[0] },
  ),
  b(
    "urinary-sepsis",
    "infection",
    "sepsis",
    "infeksjonsutløst organsvikt fra urinveier",
    "feber eller funksjonsfall med urinveissymptomer",
    [
      "Urinveissymptomer, nyrelosjefunn og baseline",
      "Urinanalyse/dyrkning, nyrefunksjon og infeksjonsprøver",
      "Blodgass, laktat og sirkulasjonsutvikling",
    ],
    "Skille symptomgivende infeksjonsfokus fra tilfeldig bakteriuri",
    "Vurdere hypovolemi, nyresvikt og legemidler samlet",
    ["sepsis-current", "geriatrics"],
    { bloodGasRelevant: true },
  ),
  b(
    "hypovolemic-shock",
    "infection",
    "hypovolemisk-sjokk",
    "redusert sirkulerende volum etter væsketap",
    "sirkulasjonspåvirkning etter uttalt væsketap",
    [
      "Inntak, tap, diurese og perfusjonsfunn",
      "Blodgass, laktat, elektrolytter, hemoglobin og nyrefunksjon",
      "Tidsfestet behandlingsrespons",
    ],
    "Skille volumtap fra distributiv og kardiogen svikt",
    "Revurdere perfusjon og væskebalanse ved komorbiditet",
    ["fluid-balance", "first-actions"],
    { bloodGasRelevant: true, secondDecision: DECISIONS[3] },
  ),
  b(
    "child-bronchiolitis",
    "pediatrics",
    "bronkiolitt",
    "nedre luftveisobstruksjon hos spedbarn",
    "spisevansker og økende pustearbeid",
    [
      "Eksakt alder i måneder/døgn, vekt og prematuritet",
      "Kontakt, pustearbeid, metning, drikke og bleier",
      "Foreldrenes beskrivelse og full undersøkelse",
    ],
    "Vurdere respirasjon og hydrering ut fra alder",
    "Prioritere forverring og begrunne omsorgsnivå",
    ["pediatrics", "assignment-1"],
    { minAge: 0, maxAge: 2, settings: ambulatory, secondDecision: DECISIONS[0] },
  ),
  b(
    "child-croup",
    "pediatrics",
    "akutt-laryngitt",
    "øvre luftveisobstruksjon",
    "gjøende hoste og inspiratoriske lyder",
    [
      "Alder, stridor i hvile, sikling, tale/gråt og kontakt",
      "Temperatur, metning, pustearbeid og eventuell behandlingsrespons",
    ],
    "Skille øvre luftveisobstruksjon fra andre pustevansker",
    "Prioritere luftvei og trygg kontakt med barnet",
    ["pediatrics", "first-actions"],
    { minAge: 0, maxAge: 8, settings: ambulatory, secondDecision: DECISIONS[0] },
  ),
  b(
    "child-dehydration",
    "pediatrics",
    "gastroenteritt-med-dehydrering",
    "væske- og elektrolyttap",
    "oppkast, diaré og redusert kontakt",
    [
      "Vekt, eksakt alder, inntak/tap og diurese",
      "Alderstilpassede vitalia/hydreringsfunn",
      "Glukose, elektrolytter, nyrefunksjon og blodgass",
    ],
    "Knytte dehydrering til syre-base og elektrolytter",
    "Begrunne observasjon av perfusjon og kontakt",
    ["pediatrics", "fluid-balance"],
    { minAge: 0, maxAge: 15, bloodGasRelevant: true },
  ),
  b(
    "child-triage",
    "pediatrics",
    "prioritering-av-akutt-syke-barn",
    "forskjellig grad av respirasjons- og sirkulasjonspåvirkning",
    "flere barn med komplette presentasjoner",
    [
      "Alder og vitalia for hvert barn",
      "Kontakt, pustearbeid, hud/perfusjon og foreldrebekymring",
      "Alle prøvesvar som brukes i oppgaven",
    ],
    "Sammenligne klinisk alvorlighet fremfor køtid eller feber alene",
    "Begrunne prioritering og ny vurdering av ventende barn",
    ["pediatrics", "assignment-1"],
    { minAge: 0, maxAge: 15, settings: ["legevakt", "mottak"], secondDecision: DECISIONS[0] },
  ),
  b(
    "geriatric-delirium",
    "geriatrics",
    "delirium",
    "akutt cerebral dysfunksjon ved somatisk sykdom",
    "akutt funksjonsfall og endret oppmerksomhet",
    [
      "Baseline kognisjon/funksjon og pårørendehistorie",
      "Oppmerksomhet, bevissthet og vitalia",
      "Legemiddelendringer, infeksjonsfunn, glukose, elektrolytter og nyrefunksjon",
    ],
    "Skille delirium fra demens og identifisere utløsende sykdom",
    "Integrere årsaksbehandling, trygghet og funksjon",
    ["geriatrics", "liaison-psychiatry", "deterioration"],
    { minAge: 70, maxAge: 95 },
  ),
  b(
    "geriatric-aki",
    "geriatrics",
    "akutt-nyreskade",
    "hypovolemi og nyrepåvirkende legemidler",
    "redusert diurese og tiltagende slapphet",
    [
      "Tidligere/aktuell kreatinin, diurese og elektrolytter",
      "Dosefestet medisinliste inkludert reseptfrie midler",
      "Væskestatus, sirkulasjon og blodgass",
    ],
    "Vurdere akutt nyreendring og legemiddelbidrag",
    "Avveie volumstatus, medikamentrisiko og overvåking",
    ["geriatrics", "fluid-balance", "acute-kidney-current", "nsaid-renal-current"],
    { minAge: 70, maxAge: 95, bloodGasRelevant: true },
  ),
  b(
    "geriatric-retention",
    "geriatrics",
    "urinretensjon",
    "obstruksjon eller legemiddelutløst svikt i blæretømming",
    "uro, magesmerter og funksjonsfall",
    [
      "Miksjonshistorie, medisinliste og abdominalfunn",
      "Blæreskann, nyrefunksjon og urinfunn",
      "Baseline kognisjon og endringstempo",
    ],
    "Knytte akutt funksjonsendring til urinretensjon",
    "Revurdere symptomer og nyrefunksjon etter oppgitt avlastning",
    ["geriatrics", "fluid-balance"],
    { minAge: 70, maxAge: 95, secondDecision: DECISIONS[3] },
  ),
  b(
    "occult-hip-fracture",
    "geriatrics",
    "hoftenaert-brudd",
    "lavenergitraume med vedvarende funksjonstap",
    "smerter og manglende belastningsevne etter fall",
    [
      "Fallhendelse og mulig synkope",
      "Funksjon før/etter og hofteundersøkelse",
      "Røntgen og MR/CT-svar dersom diagnosen skal avklares",
    ],
    "Vurdere fortsatt bruddmistanke etter negativt første røntgen",
    "Begrunne trygg overgang ut fra funksjon, støtte og pasientønske",
    ["hip-injury", "syncope", "geriatrics", "assignment-2"],
    { minAge: 70, maxAge: 95, secondDecision: DECISIONS[4] },
  ),
  b(
    "stroke",
    "trauma-neuro",
    "akutt-hjerneslag",
    "akutt fokal cerebral iskemi",
    "ny språkforstyrrelse eller fokal kraftsvikt",
    [
      "Debut/sist sett frisk og tidligere funksjon",
      "Nevrologisk status inklusive NIHSS-funn, glukose og antikoagulasjon",
      "Full CT/CT-angiografirapport og tolket EKG",
    ],
    "Skille fokalt slagbilde fra metabolsk eller postiktal forklaring",
    "Prioritere slagforløp og ivareta svelg, kommunikasjon og overlevering",
    ["stroke-current", "first-actions"],
    { settings: hospital, secondDecision: DECISIONS[0] },
  ),
  b(
    "head-injury",
    "trauma-neuro",
    "intrakraniell-skade",
    "traumatisk blødning med antikoagulasjonsrisiko",
    "hodeskade og endret bevissthet etter fall",
    [
      "Mekanisme og tidslinje",
      "GCS-komponenter, pupiller og fokalnevrologi",
      "Antikoagulasjon, glukose og full CT-rapport",
    ],
    "Skille traumatisk skade fra årsaken til fallet",
    "Begrunne gjentatt nevrologisk vurdering og overlevering",
    ["first-actions", "geriatrics", "syncope"],
    { minAge: 16, settings: hospital, secondDecision: DECISIONS[3] },
  ),
  b(
    "hemorrhagic-trauma",
    "trauma-neuro",
    "hemoragisk-sjokk",
    "blodtap etter traume",
    "ulykke med smertefull skade og hypoperfusjon",
    [
      "Mekanisme, blødning og kroppsundersøkelse",
      "Sirkulasjonsutvikling, Hb og koagulasjon",
      "Blodgass/laktat og komplette bilde-/ultralydrapporter",
    ],
    "Vurdere blødningssjokk utover den synlige skaden",
    "Prioritere blødningskontroll og koordinert førstehåndtering",
    ["first-actions", "surgical-stress", "fluid-balance"],
    { minAge: 16, settings: hospital, bloodGasRelevant: true, secondDecision: DECISIONS[0] },
  ),
  b(
    "dka",
    "metabolic",
    "diabetisk-ketoacidose",
    "insulinmangel med ketogenese og væsketap",
    "tørste, kvalme og dyspné ved diabetes",
    [
      "Glukose, blodketoner, blodgass, Na/K/Cl og nyrefunksjon",
      "Inntak, tap, insulinbruk og utløsende sykdom",
      "Tolket EKG ved kaliumforstyrrelse",
    ],
    "Knytte acidose til ketoner og insulinmangel",
    "Vurdere hvorfor væske, insulin og kalium følges samlet",
    ["endocrine", "fluid-balance"],
    { bloodGasRelevant: true },
  ),
  b(
    "sglt2-dka",
    "metabolic",
    "diabetisk-ketoacidose",
    "SGLT2-assosiert ketogenese uten uttalt hyperglykemi",
    "kvalme og rask pust under akutt sykdom",
    [
      "Glukose, blodketoner, blodgass, elektrolytter og nyrefunksjon",
      "Dose/tid for SGLT2-hemmer og insulin",
      "Faste, væsketap og utløsende sykdom",
    ],
    "Gjenkjenne ketoacidose ved beskjedent forhøyet glukose",
    "Begrunne legemiddelrevurdering ved mistenkt SGLT2-assosiert ketoacidose",
    ["sglt2-current", "endocrine", "fluid-balance"],
    { settings: hospital, bloodGasRelevant: true },
  ),
  b(
    "hhs",
    "metabolic",
    "hyperosmolart-hyperglykemisk-syndrom",
    "osmotisk diurese og uttalt dehydrering",
    "gradvis funksjonsfall, tørste og bevissthetsendring",
    [
      "Glukose, osmolalitet, Na/K, ketoner og nyrefunksjon",
      "Blodgass, væskestatus, varighet og diabetesmedisiner",
    ],
    "Skille hyperosmolar tilstand fra ketoacidose",
    "Begrunne overvåking av nevrologi, væskebalanse og elektrolytter",
    ["endocrine", "fluid-balance", "geriatrics"],
    { minAge: 40, settings: hospital, bloodGasRelevant: true },
  ),
  b(
    "hypoglycemia",
    "metabolic",
    "hypoglykemi",
    "ubalanse mellom næring og glukosesenkende behandling",
    "akutt svetting, uro eller redusert bevissthet",
    [
      "Glukose og respons på allerede gitt behandling",
      "Preparat/dose, siste inntak, måltider og nyrefunksjon",
      "Nevrologisk undersøkelse",
    ],
    "Skille hypoglykemi fra nevrologisk eller psykiatrisk sykdom",
    "Vurdere residivfare ut fra preparat og matinntak",
    ["endocrine", "geriatrics"],
  ),
  b(
    "adrenal-crisis",
    "metabolic",
    "binyrebarkkrise",
    "kortisolmangel under stress eller manglende steroidtilførsel",
    "magesmerter, oppkast og sirkulasjonssvikt",
    [
      "Steroiddose, siste inntak og evne til å beholde tabletter",
      "Na/K, glukose, nyrefunksjon og blodgass",
      "Sirkulasjon og hormonprøver hvis spørsmålet bruker dem",
    ],
    "Vurdere binyrebarkkrise ved abdominalt og sirkulatorisk bilde",
    "Begrunne handling ved sterk mistanke mens utredning pågår",
    ["endocrine", "first-actions"],
    { settings: hospital, bloodGasRelevant: true, secondDecision: DECISIONS[0] },
  ),
  b(
    "hyponatremia",
    "metabolic",
    "hyponatremi",
    "vannoverskudd i forhold til natrium",
    "kvalme, ustøhet og kognitiv endring",
    [
      "Tidligere/aktuell Na og symptomtempo",
      "Serum-/urinosmolalitet, urin-Na og volumstatus",
      "Medisiner, nyrefunksjon og relevant endokrin utredning",
    ],
    "Skille årsaker med osmolalitet, volumstatus og legemidler",
    "Begrunne at tempo og årsak påvirker overvåking og behandling",
    ["endocrine", "fluid-balance"],
  ),
  b(
    "hyperkalemia",
    "metabolic",
    "hyperkalemi",
    "redusert renal utskillelse og legemiddelbidrag",
    "svakhet eller rytmepåvirkning",
    [
      "Kalium med hemolyseopplysning/kontrollprøve",
      "Nyrefunksjon, diurese og blodgass",
      "Tolket EKG og dosefestet medisinliste",
    ],
    "Skille reell kaliumforstyrrelse fra prøvefeil og finne årsaksbidrag",
    "Prioritere rytmerisiko og medikament-/nyrevurdering",
    ["fluid-balance", "geriatrics", "first-actions"],
    { settings: hospital, bloodGasRelevant: true, secondDecision: DECISIONS[0] },
  ),
  b(
    "ileus",
    "abdomen",
    "ileus",
    "mekanisk passasjehinder med væsketap og mulig iskemi",
    "takvise smerter, oppkast og oppblåst mage",
    [
      "Kirurgihistorie, avføring/luft, hernie- og abdominalfunn",
      "Full CT-rapport",
      "Elektrolytter, nyrefunksjon, blodgass og laktat",
    ],
    "Skille mekanisk fra paralytisk ileus og vurdere iskemi",
    "Integrere væsketap og behov for kirurgisk vurdering",
    ["ileus-current", "fluid-balance", "surgical-stress"],
    { settings: hospital, bloodGasRelevant: true },
  ),
  b(
    "peritonitis",
    "abdomen",
    "abdominal-sepsis",
    "intraabdominal infeksjon med organpåvirkning",
    "magesmerter, oppkast og allmennpåvirkning",
    [
      "Abdominalstatus og full bilderapport",
      "Vitalia, blodgass, laktat, Na/K/Cl og nyrefunksjon",
      "Infeksjonsprøver og eksplisitt behandlingstidslinje",
    ],
    "Avdekke alvorlig sykdom ved nær normal pH og blandet syre-baseforstyrrelse",
    "Prioritere kildekontroll og organpåvirkning samlet",
    ["sepsis-current", "fluid-balance", "first-actions"],
    { settings: hospital, bloodGasRelevant: true, secondDecision: DECISIONS[0] },
  ),
  b(
    "gi-bleeding",
    "abdomen",
    "gastrointestinal-bloedning",
    "blodtap med legemiddelrelatert blødningsrisiko",
    "svimmelhet, melena eller hematemese",
    [
      "Blødningsanamnese og sirkulasjonsutvikling",
      "Hb-serier, nyrefunksjon og koagulasjon",
      "NSAID/antitrombotisk historie og relevante undersøkelsesresultater",
    ],
    "Knytte synkope eller funksjonsfall til gastrointestinal blødning",
    "Avveie blødning, komorbiditet og legemiddelrisiko",
    ["geriatrics", "fluid-balance", "first-actions"],
    { settings: hospital },
  ),
  b(
    "self-harm",
    "mental-health",
    "selvskading-og-suicidalitet",
    "akutt krise med individuelt somatisk og psykisk hjelpebehov",
    "pasient etter selvskading",
    [
      "Skade/eksponering og somatiske funn/prøvesvar",
      "Full samtale om tanker, planer, hensikt, tidligere hendelser og støtte",
      "Livssituasjon, rus/medisiner og tilgjengelig hjelp",
    ],
    "Skille selvskadingsfunksjon, suicidalitet og somatisk behov uten automatisk risikokategori",
    "Utforme respektfull samtale og konkret beskyttelses-/oppfølgingsplan",
    ["self-harm", "suicidality", "liaison-psychiatry"],
    { minAge: 15, maxAge: 75, settings: ambulatory, secondDecision: DECISIONS[5] },
  ),
  b(
    "eating-disorder",
    "mental-health",
    "somatisk-komplikasjon-ved-spiseforstyrrelse",
    "ernæringssvikt og elektrolyttap med rytmerisiko",
    "svimmelhet ved lite matinntak eller oppkast",
    [
      "Vektutvikling, inntak, oppkast og legemidler",
      "K/Mg/fosfat, glukose og nyrefunksjon",
      "Tolket EKG/QTc og blodgass",
    ],
    "Integrere psykisk lidelse med somatisk alvorlighet",
    "Begrunne trygg vurdering og allianse utover vekt alene",
    ["eating-disorders", "qt-risk", "liaison-psychiatry"],
    { minAge: 15, maxAge: 70, bloodGasRelevant: true },
  ),
  b(
    "somatic-agitation",
    "mental-health",
    "delirium",
    "somatisk sykdom med akutt kognitiv endring",
    "uro eller hallusinasjoner ved psykisk sykehistorie",
    [
      "Baseline, tempo, oppmerksomhet og orientering",
      "Vitalia, glukose, elektrolytter og somatisk undersøkelse",
      "Rus-/medisinendringer og pårørendeopplysninger",
    ],
    "Unngå å forklare nye somatiske tegn med tidligere psykiatrisk diagnose",
    "Kombinere trygg kommunikasjon og årsaksrettet vurdering",
    ["liaison-psychiatry", "geriatrics", "communication"],
    { secondDecision: DECISIONS[5] },
  ),
  b(
    "opioid-toxicity",
    "substance",
    "opioidforgiftning",
    "opioidutløst hypoventilasjon og CNS-depresjon",
    "redusert våkenhet etter opioider",
    [
      "Preparat, formulering, dose, tid og samtidig inntak",
      "Pupiller, bevissthet, respirasjonsdybde/frekvens og oksygen",
      "Blodgass, glukose, nyrefunksjon og respons",
    ],
    "Skille ventilasjonssvikt fra beroligende metning under oksygen",
    "Begrunne ventilasjon, antidotvurdering og observasjon etter respons",
    ["opioid-current", "substance", "respiration"],
    { bloodGasRelevant: true },
  ),
  b(
    "alcohol-withdrawal",
    "substance",
    "alkoholabstinens",
    "nevrologisk hyperaktivitet etter redusert alkoholinntak",
    "tremor, uro og vegetative symptomer",
    [
      "Vanlig/siste inntak og tidligere abstinens",
      "Vitalia, bevissthet, glukose og elektrolytter",
      "Somatiske funn og prøver for alternativer",
    ],
    "Skille abstinens fra sepsis, hypoglykemi og annen deliriumårsak",
    "Planlegge observasjon og kommunikasjon uten stigma",
    ["substance", "liaison-psychiatry", "fluid-balance"],
    { settings: gasSettings },
  ),
  b(
    "alcoholic-ketoacidosis",
    "substance",
    "alkoholisk-ketoacidose",
    "ketogenese ved alkoholbruk, oppkast og lite næring",
    "magesmerter og rask pust etter lite matinntak",
    [
      "Alkoholhistorie, glukose og blodketoner",
      "Blodgass, Na/K/Cl, laktat og nyrefunksjon",
      "Relevante toksikologiske og infeksjonsmessige resultater",
    ],
    "Skille alkoholisk ketoacidose fra diabetes, laktacidose og toksisk alkohol",
    "Integrere ernæring, elektrolytter og samtidig somatikk",
    ["alcoholic-ketoacidosis", "substance"],
    { settings: hospital, bloodGasRelevant: true },
  ),
  b(
    "lar-pain",
    "substance",
    "akutte-smerter-under-lar",
    "akutt vevsskade ved opioidtoleranse",
    "smertefull skade hos person i LAR",
    [
      "Skadediagnostikk og objektive funn",
      "Bekreftet LAR-preparat/dose/siste inntak og øvrige medisiner",
      "Smerte, funksjon, sedasjon og respirasjon",
    ],
    "Vurdere smerte og toleranse uten å anta rusmotivasjon",
    "Begrunne samordnet lindring og bivirkningsobservasjon",
    ["substance", "pain", "assignment-1"],
    { settings: gasSettings },
  ),
  b(
    "palliative-decline",
    "treatment-limits",
    "akutt-forverring-ved-alvorlig-grunnsykdom",
    "reversibel utløsende sykdom ved begrenset reserve",
    "akutt forverring ved alvorlig sykdom",
    [
      "Grunnsykdom, funksjon, behandlingsavklaringer og pasientønske",
      "Komplette funn/prøver som avklarer forverringen",
      "Pårørendeopplysninger og omsorg",
    ],
    "Skille reversibel sykdom fra antatt terminal progresjon",
    "Avveie nytte, belastning og pasientens mål",
    ["treatment-goals", "geriatrics", "decision-capacity"],
    { minAge: 40, maxAge: 95, secondDecision: DECISIONS[5] },
  ),
  b(
    "palliative-pain",
    "treatment-limits",
    "kreftrelaterte-smerter",
    "sammensatt fysisk, psykisk, sosial og eksistensiell smerte",
    "gjennombruddssmerter og behandlingsbekymring",
    [
      "Smertetype, døgnvariasjon, funksjon og pasientmål",
      "Dosefestet medisinliste, nyrefunksjon og bivirkninger",
      "Undersøkelsesresultater som skiller progresjon, komplikasjon og behandlingseffekt",
    ],
    "Skille gjennombruddssmerter fra ny komplikasjon",
    "Avveie lindring, våkenhet og funksjon med pasienten",
    ["cancer-pain", "pain", "treatment-goals"],
    { minAge: 30, secondDecision: DECISIONS[5] },
  ),
  b(
    "sudden-death",
    "treatment-limits",
    "etterlatte-ved-braa-doed",
    "akutt sorg og behov for informasjon og oppfølging",
    "akutt pasientforløp som ender med bekreftet uventet dødsfall og oppfølging av voksne og barn i familien",
    [
      "Akuttforløpet før dødsfallet, med relevante premortale funn, vitalia og prøver og eksplisitte måletidspunkter",
      "Bekreftet hendelsesforløp og informasjon familien har fått",
      "Familiens reaksjoner, barnas alder, støtte og praktiske behov",
    ],
    "Identifisere behov uten å sykeliggjøre normale sorgreaksjoner",
    "Planlegge tydelig informasjon og konkret videre kontakt",
    ["bereavement", "assignment-1", "communication"],
    {
      settings: ["hjem", "mottak", "sengepost"],
      formats: ["long"],
      holisticFocus: [
        "Knytt pårørendearbeidet til et komplett beskrevet akuttforløp hos pasienten",
        "Tidfest premortale målinger; ikke konstruer nye pasientvitalia i samtalen etter bekreftet død",
        "Familiens informasjon, barns behov og konkret videre oppfølging",
      ],
      secondDecision: DECISIONS[5],
      trajectories: [TRAJECTORIES[2]],
    },
  ),
  b(
    "violence",
    "safeguarding",
    "skade-etter-vold",
    "fysisk skade og pågående sikkerhetsbehov",
    "pasient ønsker hjem etter vold",
    [
      "Komplett skadeundersøkelse og relevante prøver/bilder",
      "Pasientens egen historie i trygg samtale",
      "Hjemmesituasjon, språk, beslutningsforståelse og støtte",
    ],
    "Vurdere skade og sikkerhet uten stereotypier",
    "Drøfte pasientønske, beslutningskompetanse og oppfølging",
    ["violence", "communication", "decision-capacity", "assignment-1"],
    { settings: ambulatory, secondDecision: DECISIONS[5] },
  ),
  b(
    "interpreted-consultation",
    "safeguarding",
    "kommunikasjonsbarriere-ved-akutt-sykdom",
    "misforståelser påvirker kliniske beslutninger",
    "akutt sykdom og behov for tilrettelagt samtale",
    [
      "Full klinisk situasjon med relevante funn og prøver",
      "Tolket samtale, pasientønske og forståelse",
      "Komplette opplysninger til overlevering",
    ],
    "Skille språkbarriere fra manglende beslutningsforståelse",
    "Utforme forståelig informasjon og presis overlevering",
    ["communication", "decision-capacity", "assignment-1"],
    { settings: [...faceToFace, "telefon"], secondDecision: DECISIONS[5] },
  ),
  b(
    "cord-compression",
    "oncology",
    "malign-medullakompresjon",
    "tumorkompresjon av ryggmarg eller cauda equina",
    "ryggsmerter og ny funksjonsendring",
    [
      "Smerteforløp, kraft, sensibilitet, gang- og blærefunksjon",
      "Full MR-totalcolumna-rapport",
      "Grunnsykdom, funksjon og behandlingsmål",
    ],
    "Knytte nevrologiske funn til tidskritisk kompresjon",
    "Begrunne rask avklaring og bevaring av nevrologisk funksjon",
    ["cord-compression-current", "cancer-pain", "first-actions"],
    { minAge: 30, settings: hospital, secondDecision: DECISIONS[0] },
  ),
  b(
    "cancer-hypercalcemia",
    "oncology",
    "hyperkalsemi",
    "malignitetsrelatert kalsiumstigning og dehydrering",
    "tørste, obstipasjon og økende sløvhet",
    [
      "Ionisert kalsium eller total-kalsium med albumin",
      "Na/K, nyrefunksjon, væskestatus og medisinliste",
      "Tempo, nevrologi og behandlingsmål",
    ],
    "Skille metabolsk komplikasjon fra antatt progresjon eller sedasjon",
    "Planlegge oppfølging av kalsium, nyrefunksjon og symptomer",
    ["hypercalcemia-current", "cancer-pain", "fluid-balance"],
    { minAge: 30, settings: hospital },
  ),
  b(
    "neutropenic-infection",
    "oncology",
    "infeksjon-ved-noytropeni",
    "behandlingsrelatert immunsuppresjon",
    "feber eller funksjonsendring etter kreftbehandling",
    [
      "Behandlingstype/tid og nøytrofiltall",
      "Vitalia, organprøver og fokusundersøkelser",
      "Mikrobiologiske prøver, nyrefunksjon og medisiner",
    ],
    "Vurdere infeksjon i lys av behandling og immunsuppresjon",
    "Prioritere alvorlig sykdom selv ved beskjedne lokale symptomer",
    ["sepsis-current", "cancer-pain", "first-actions"],
    { settings: hospital, secondDecision: DECISIONS[0] },
  ),
  b(
    "tonsillitis",
    "ent",
    "akutt-tonsillitt",
    "lokal viral eller bakteriell svelginfeksjon",
    "halssmerter, feber og svelgvansker",
    [
      "Varighet, hoste, allmenntilstand, svelg og lymfeknuter",
      "Drikkeevne og luftvei",
      "Relevant Strep A-/dyrkningssvar",
    ],
    "Vurdere halsinfeksjon med oppgitt hurtigtest i klinisk kontekst",
    "Begrunne symptomlindring og vurdering av antibiotikabehov",
    ["ent", "ent-current"],
    { minAge: 5, maxAge: 80, settings: ambulatory },
  ),
  b(
    "peritonsillar-abscess",
    "ent",
    "peritonsillaer-abscess",
    "lokal komplikasjon til svelginfeksjon",
    "ensidige halssmerter, trismus og drikkevansker",
    [
      "Svelg/uvula, stemme og gapeevne",
      "Luftvei, hydrering, feber og allmenntilstand",
      "Full ØNH-vurdering og eventuelle bildesvar",
    ],
    "Skille abscess fra ukomplisert tonsillitt og andre svelgtilstander",
    "Prioritere luftvei, væske og ØNH-vurdering",
    ["ent", "first-actions"],
    { minAge: 10, maxAge: 80, settings: gasSettings, secondDecision: DECISIONS[0] },
  ),
  b(
    "mononucleosis",
    "ent",
    "mononukleose",
    "systemisk EBV-infeksjon",
    "vedvarende halssmerter, tretthet og lymfeknuter",
    [
      "Svelg/luftvei, lymfeknuter og abdomen",
      "Blodstatus, leverprøver og EBV-test med tidskontekst",
      "Tidligere behandling og utslett",
    ],
    "Integrere systemiske funn fremfor å anta bakteriell tonsillitt",
    "Vurdere komplikasjoner, funksjon og oppfølging",
    ["ent", "ent-current"],
    { minAge: 10, maxAge: 40, settings: ambulatory, secondDecision: DECISIONS[4] },
  ),
  b(
    "postop-hypoventilation",
    "postoperative",
    "opioidutloest-ventilasjonssvikt",
    "hypoventilasjon etter anestesi og analgetika",
    "sløvhet etter operasjon",
    [
      "Inngrep/anestesi, analgetika med tid/dose og nyrefunksjon",
      "Bevissthet, respirasjonsdybde/frekvens og oksygen",
      "Tidsfestet blodgass og behandlingsrespons",
    ],
    "Skille legemiddeleffekt fra andre postoperative komplikasjoner",
    "Avveie smertelindring og ventilasjon ved revurdering",
    ["surgical-stress", "opioid-current", "respiration"],
    { settings: hospital, bloodGasRelevant: true, secondDecision: DECISIONS[3] },
  ),
  b(
    "postop-lung",
    "postoperative",
    "postoperativ-lungekomplikasjon",
    "redusert hostekraft og sekretstagnasjon med atelektase eller infeksjon",
    "tungpust og redusert mobilitet etter kirurgi",
    [
      "Operasjonstid, funksjon og smerte ved hoste/bevegelse",
      "Respirasjonsfunn, røntgen, infeksjonsprøver og blodgass",
      "Oksygen- og medikamenthistorikk",
    ],
    "Skille infeksjon, atelektase og andre årsaker til postoperativ tungpust",
    "Knytte lindring, mobilisering og ernæring til respirasjonen",
    ["surgical-stress", "respiration", "sepsis-current"],
    { settings: hospital, bloodGasRelevant: true },
  ),
  b(
    "postop-ileus",
    "postoperative",
    "postoperativ-ileus",
    "redusert tarmmotilitet etter kirurgi og opioider",
    "kvalme, oppblåsthet og dårlig matinntak etter operasjon",
    [
      "Inngrep, avføring/luft, abdomen og full CT-rapport",
      "Opioider, øvrige medisiner og væskeregnskap",
      "Elektrolytter, nyrefunksjon og infeksjons-/iskemifunn",
    ],
    "Skille funksjonell tarmparese fra mekanisk obstruksjon",
    "Integrere bivirkninger, mobilitet og ernæring",
    ["surgical-stress", "ileus-current", "fluid-balance"],
    { settings: hospital },
  ),
];

type Topic = {
  id: string;
  label: string;
  minAge: number;
  maxAge: number;
  patterns: readonly string[];
  sources: readonly string[];
};
const topicLabels: readonly [string, string][] = [
  ["circulation", "Sirkulasjon og respirasjon"],
  ["infection", "Infeksjon og sjokk"],
  ["pediatrics", "Akutt syke barn og prioritering"],
  ["geriatrics", "Geriatri, funksjon og omsorgsnivå"],
  ["trauma-neuro", "Traumer og nevrologi"],
  ["metabolic", "Endokrinologi, væske og elektrolytter"],
  ["abdomen", "Akutte abdominale tilstander"],
  ["mental-health", "Psykisk helse og somatisk risiko"],
  ["substance", "Rus, intoksikasjon og smerter"],
  ["treatment-limits", "Behandlingsavklaring og pårørende"],
  ["safeguarding", "Vold, beslutningskompetanse og kommunikasjon"],
  ["oncology", "Akutte kreft- og behandlingskomplikasjoner"],
  ["ent", "Øre, nese og hals"],
  ["postoperative", "Postoperative komplikasjoner"],
  ["blood-gas", "Blodgass og syre-base i kliniske situasjoner"],
];
function topicBlueprints(id: string) {
  return CLINICAL_BLUEPRINTS.filter((entry) =>
    id === "blood-gas" ? entry.bloodGasRelevant : entry.topicId === id,
  );
}
export const TOPICS: readonly Topic[] = topicLabels.map(([id, label]) => {
  const entries = topicBlueprints(id);
  return {
    id,
    label,
    minAge: Math.min(...entries.map((entry) => entry.minAge)),
    maxAge: Math.max(...entries.map((entry) => entry.maxAge)),
    patterns: entries.map((entry) => entry.presentation),
    sources: [...new Set(entries.flatMap((entry) => entry.sourceIds))],
  };
});
export type HistoryEntry = {
  engine: string;
  presentation: string;
  setting: string;
  diagnosis_family: string | null;
  blueprintId?: string;
  fingerprint?: string;
  mechanism?: string;
  clinicalPresentation?: string;
  reasoningTarget?: string;
  pivotalFindings?: readonly string[];
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
  blueprintId: string;
  diagnosisFamily: string;
  mechanism: string;
  reasoningTarget: string;
  pivotalEvidence: string[];
  requiredData: string[];
  holisticFocus: string[];
  bloodGasRelevant: boolean;
};
function choose<T>(items: readonly T[], random: () => number): T {
  if (!items.length) throw new Error("Ingen kompatibel casekombinasjon.");
  const value = random();
  const fraction = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  return items[Math.min(items.length - 1, Math.floor(fraction * items.length))]!;
}
function fits(entry: ClinicalBlueprint, setting: SettingId, format?: CaseFormat) {
  return (
    (!format || entry.formats.includes(format)) &&
    (setting === "auto" ||
      (entry.settings.includes(setting) &&
        (setting !== "sykehjem" || entry.maxAge >= 70) &&
        (setting !== "kad" || entry.maxAge >= 18)))
  );
}
export function isTopicSettingCompatible(
  topicId: string,
  setting: SettingId,
  format?: CaseFormat,
): boolean {
  return (topicId === "auto" ? CLINICAL_BLUEPRINTS : topicBlueprints(topicId)).some((entry) =>
    fits(entry, setting, format),
  );
}
export function semanticFingerprint(entry: ClinicalBlueprint, focus: ReasoningFocus) {
  return [entry.diagnosisFamily, entry.mechanism, focus.label, ...focus.pivotalEvidence].join("|");
}
export function drawVariety(
  history: HistoryEntry[],
  options: {
    startSetting: SettingId;
    difficulty: Difficulty;
    topic?: string;
    bloodGas?: boolean;
    blueprintId?: string;
    format?: CaseFormat;
  },
  random = Math.random,
): VarietyDraw {
  const candidatesFor = (id: string) =>
    topicBlueprints(id).filter(
      (entry) =>
        fits(entry, options.startSetting, options.format) &&
        (!options.bloodGas || entry.bloodGasRelevant) &&
        (!options.blueprintId || entry.id === options.blueprintId),
    );
  const compatible = TOPICS.filter(
    (topic) =>
      (!options.topic || options.topic === "auto" || options.topic === topic.id) &&
      candidatesFor(topic.id).length,
  );
  if (!compatible.length)
    throw new Error("Temaet passer ikke til valgt startsted, format eller blodgassvalg.");
  const count = (id: string) => history.filter((h) => h.presentation === id).length;
  const minimum = Math.min(...compatible.map((topic) => count(topic.id)));
  const topic = choose(
    compatible.filter((entry) => count(entry.id) === minimum),
    random,
  );
  const candidates = candidatesFor(topic.id).flatMap((entry) =>
    entry.reasoningTargets.map((focus) => ({
      entry,
      focus,
      fingerprint: semanticFingerprint(entry, focus),
    })),
  );
  // v2 stored a fingerprint in diagnosis_family; v3 keeps the actual family separate.
  const novel = candidates.filter(
    (candidate) =>
      !history.some((h) => (h.fingerprint ?? h.diagnosis_family) === candidate.fingerprint),
  );
  const pool = novel.length ? novel : candidates;
  const score = (candidate: (typeof candidates)[number]) =>
    history.reduce(
      (sum, h, index) =>
        sum +
        (h.diagnosis_family === candidate.entry.diagnosisFamily ? (index < 3 ? 8 : 1) : 0) +
        (h.blueprintId === candidate.entry.id ? 2 : 0) +
        (index < 2 && h.engine === candidate.focus.decision ? 1 : 0),
      0,
    );
  const best = Math.min(...pool.map(score));
  const selected = choose(
    pool.filter((candidate) => score(candidate) === best),
    random,
  );
  const entry = selected.entry;
  const settings = START_SETTINGS.filter((s) => s.id !== "auto" && fits(entry, s.id));
  const otherSettings = settings.filter((s) => s.id !== history[0]?.setting);
  const setting =
    options.startSetting === "auto"
      ? choose(otherSettings.length ? otherSettings : settings, random)
      : settings.find((s) => s.id === options.startSetting);
  if (!setting) throw new Error("Temaet passer ikke til valgt startsted.");
  return {
    topicId: topic.id,
    topic: topic.label,
    pattern: entry.presentation,
    decision: selected.focus.decision,
    trajectory: choose(entry.trajectories, random),
    minAge:
      setting.id === "sykehjem"
        ? Math.max(70, entry.minAge)
        : setting.id === "kad"
          ? Math.max(18, entry.minAge)
          : entry.minAge,
    maxAge: entry.maxAge,
    setting: setting.label,
    settingId: setting.id,
    sourceIds: [...entry.sourceIds],
    difficulty: options.difficulty,
    fingerprint: selected.fingerprint,
    blueprintId: entry.id,
    diagnosisFamily: entry.diagnosisFamily,
    mechanism: entry.mechanism,
    reasoningTarget: selected.focus.label,
    pivotalEvidence: [...selected.focus.pivotalEvidence],
    requiredData: [...entry.requiredData],
    holisticFocus: [...entry.holisticFocus],
    bloodGasRelevant: entry.bloodGasRelevant,
  };
}
