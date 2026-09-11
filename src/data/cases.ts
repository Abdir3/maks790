import { validateCase, type CaseDefinition } from "@/lib/case-model";

export const randiCase: CaseDefinition = validateCase({
  id: "randi-rangeland",
  title: "Fall i hjemmet",
  patient: "Randi Rangeland · f. 1948",
  specialty: "Akuttmedisin",
  background: [
    {
      type: "paragraph",
      text: "Randi Rangeland (f.1948) er enke og bor alene i en leilighet i fjerde etasje med heis. Hun er i stor grad selvhjulpen i dagliglivet og klarer personlig hygiene, enkel matlaging og lettere husarbeid. Hun går daglige korte turer med hunden sin. Ved lengre turer utendørs bruker hun rullator, men innendørs går hun uten hjelpemidler.",
    },
    {
      type: "paragraph",
      text: "Datteren bor et par timers kjøretur unna og kommer vanligvis innom én gang i måneden. Da hjelper hun med storhandel, grundigere rengjøring av leiligheten og andre tyngre praktiske oppgaver.",
    },
    {
      type: "paragraph",
      text: "Randi opplever selv at hun har god helse og god funksjonsevne, og oppsøker sjelden fastlegen. Den siste tiden har hun merket at det er blitt tyngre å reise seg fra lave stoler og å bære tunge handleposer, men opplever ellers at hun fungerer godt. Hun mottar ingen kommunale helse- og omsorgstjenester og ønsker å klare seg selv. Det er viktig for henne å kunne bo hjemme så lenge som mulig.",
    },
    {
      type: "paragraph",
      text: "Tidligere sykehistorie omfatter hjerteinfarkt for ti år siden, atrieflimmer, hypertensjon og artrose. Hun bruker flere faste legemidler, men har ikke oversikt over navnene eller hva de ulike legemidlene er forskrevet for.",
    },
  ],
  parts: [
    {
      id: "ambulanse",
      title: "Prehospital fase – ambulanse",
      shortTitle: "Ambulanse",
      timeLabel: "Fredag kl. 15.30",
      content: [
        {
          type: "paragraph",
          text: "Klokken er 15.30 fredag ettermiddag. En nabo kontakter AMK fordi Randi ikke har vært ute på sin faste morgentur med hunden. Hunden bjeffer kraftig inne i leiligheten, men ingen åpner døren. Ambulansepersonellet får etter hvert tilgang til boligen ved hjelp av vaktmester.",
        },
        {
          type: "paragraph",
          text: "Randi blir funnet liggende på badegulvet iført nattkjole. Hun er våken og kontaktbar. Hun forteller:",
        },
        {
          type: "quote",
          text: "Jeg snublet i den dørterskelen igjen og falt inn mot dusjen. Denne gangen klarte jeg ikke å komme meg opp igjen. Beinet gjør fryktelig vondt.",
        },
        {
          type: "paragraph",
          text: "Hun vet ikke hvor lenge hun har ligget på gulvet, og det er vanskelig å få flere opplysninger om hendelsesforløpet. Hun er smertepåvirket, men samarbeider godt. Huden er varm og tørr, men hun er lett kald perifert.",
        },
        {
          type: "paragraph",
          text: "Badet er lite og trangt. Etter en primærundersøkelse får hun morfin 5 mg intravenøst før forflytning.",
        },
      ],
      measurements: {
        timestamp: "Fredag 15.30",
        values: [
          { id: "bp", label: "Blodtrykk", value: "150/90", unit: "mmHg" },
          { id: "pulse", label: "Puls", value: "90", unit: "/min", note: "Uregelmessig" },
          { id: "respiration", label: "Respirasjonsfrekvens", value: "20", unit: "/min" },
          { id: "spo2", label: "SpO₂", value: "96", unit: "%", note: "Romluft" },
          { id: "temperature", label: "Temperatur", value: "36,0", unit: "°C", note: "Øre" },
          {
            id: "gcs",
            label: "GCS",
            value: "14–15",
            note: "Ikke orientert for tid på døgnet, men orientert for person, sted, måned og år.",
          },
        ],
      },
      questions: [
        {
          id: "randi-1",
          label: "Oppgave 1",
          prompt:
            "Beskriv hvilke forhold ambulansepersonellet bør vurdere og planlegge før og under pasientkontakten. Begrunn vurderingene.",
        },
      ],
    },
    {
      id: "legevakt",
      title: "Prehospital fase – legevakt",
      shortTitle: "Legevakt",
      timeLabel: "Fredag kl. 16.30",
      content: [
        {
          type: "paragraph",
          text: "Under transport til legevakten får Randi ytterligere 5 mg morfin intravenøst, med god smertelindrende effekt.",
        },
        {
          type: "paragraph",
          text: "Ved ankomst legevakten klokken 16.30 får hun hjelp over på en toalettstol. På vei tilbake til båren blir hun kvalm, kaster opp og får en kortvarig episode med uttalt svimmelhet og nærsynkope.",
        },
        {
          type: "paragraph",
          text: "Legevakten har tilgang til bildediagnostikk. Røntgen av høyre kne viser en tibiaplatåfraktur.",
        },
        {
          type: "paragraph",
          text: "Etter konferering med ortopedisk vakt på sykehuset dokumenter legevaktslegen følgende:",
        },
        {
          type: "quote",
          text: "Bruddet kan behandles konservativt. Smertelindring, ingen belastning på benet og kontroll om en uke. Ortoped vurderer at det ortopedisk sett ikke foreligger indikasjon for innleggelse. Pasienten uttrykker et tydelig ønske om å reise hjem og vurderes å ha beslutningskompetanse",
        },
      ],
      questions: [
        {
          id: "randi-2",
          label: "Oppgave 2",
          prompt:
            "Drøft hvilke forhold som må vurderes før Randi kan skrives ut fra legevakten. Drøftingen må inkludere tiltak som sikrer at utskrivelse til hjemmet kan gjennomføres på en forsvarlig måte.",
        },
      ],
    },
    {
      id: "kad",
      title: "Kommunal akutt døgnenhet / Akuttmottak",
      shortTitle: "KAD / sykehus",
      timeLabel: "Lørdag kl. 02.15",
      content: [
        {
          type: "paragraph",
          text: "Legevaktslegen og sykepleieren vurderer i fellesskap at Randi ikke kan skrives ut direkte fra legevakten. Etter samtykke fra Randi legges hun derfor inn på kommunal akutt døgnenhet (KAD) for videre smertebehandling, observasjon og mobilisering.",
        },
        {
          type: "paragraph",
          text: "Klokken er 02.15 natt til lørdag. Randi har tidligere på kvelden fått en innsovingstablett. Nattsykepleieren reagerer på at Randi ikke har vært på toalettet siden ankomst legevakten, har drukket lite og har problemer med å holde oppmerksomheten i samtalen.",
        },
        { type: "paragraph", text: "Det tas nye vitale målinger:" },
      ],
      measurements: {
        timestamp: "Lørdag 02.15",
        values: [
          { id: "bp", label: "Blodtrykk", value: "110/54", unit: "mmHg" },
          { id: "pulse", label: "Puls", value: "100", unit: "/min", note: "Uregelmessig" },
          { id: "respiration", label: "Respirasjonsfrekvens", value: "25", unit: "/min" },
          { id: "spo2", label: "SpO₂", value: "92", unit: "%", note: "Romluft" },
          { id: "temperature", label: "Temperatur", value: "38,0", unit: "°C", note: "Øre" },
          {
            id: "gcs",
            label: "GCS",
            value: "13",
            note: "Holder øynene lukket når hun ikke tiltales, er ikke orientert for tid og oppgir «legevakten» når hun blir spurt hvor hun er.",
          },
        ],
      },
      afterMeasurements: [
        {
          type: "paragraph",
          text: "Blodprøver tatt tidligere på kvelden viser lett forhøyede leukocytter og CRP på 24 mg/L.",
        },
        {
          type: "paragraph",
          text: "Det besluttes å overføre Randi med ambulanse til akuttmottaket ved lokalsykehuset.",
        },
      ],
      questions: [
        {
          id: "randi-3",
          label: "Oppgave 3",
          subquestions: [
            {
              id: "randi-3a",
              label: "Oppgave 3a",
              prompt:
                "Gjør rede for hvilke tilstander som kan forklare at Randis tilstand har endret seg.",
            },
            {
              id: "randi-3b",
              label: "Oppgave 3b",
              prompt:
                "Forklar hvilke undersøkelser, observasjoner og behandlingstiltak som bør prioriteres ved ankomst akuttmottaket, og begrunn vurderingene.",
            },
          ],
        },
      ],
    },
  ],
});

export const dyspneaCase: CaseDefinition = validateCase({
  id: "akutte-pustevansker",
  title: "Akutt pustevansker",
  patient: "68 år gammel mann",
  specialty: "Indremedisin",
  parts: [
    {
      id: "presentasjon",
      title: "Pasientpresentasjon",
      timeLabel: "Kl. 09.32",
      content: [
        {
          type: "paragraph",
          text: "En 68 år gammel mann kommer til legevakt med akutt oppstått pustevansker de siste to timene. Han er urolig, svett og klager på trykk i brystet. Tidligere kjent med hypertensjon og atrieflimmer. Fast medikasjon: apiksaban, metoprolol og atorvastatin.",
        },
        {
          type: "list",
          title: "Kliniske funn",
          items: [
            "Takypné, bruker hjelpemuskulatur",
            "Svekkede respirasjonslyder basalt på høyre side",
            "Fine inspiratoriske knatrelyder bilateralt",
            "Kalde ekstremiteter, kapillærfylning 3 sekunder",
            "Uregelmessig uregelmessig puls",
          ],
        },
        {
          type: "list",
          title: "Tilgjengelige undersøkelser",
          items: ["EKG", "Røntgen thorax", "Venøs blodgass", "Blodstatus"],
        },
      ],
      measurements: {
        timestamp: "09.32",
        values: [
          { id: "pulse", label: "Puls", value: "128", unit: "/min" },
          { id: "bp", label: "Blodtrykk", value: "85/60", unit: "mmHg" },
          { id: "respiration", label: "Respirasjonsfrekvens", value: "28", unit: "/min" },
          { id: "spo2", label: "SpO₂", value: "88", unit: "%" },
          { id: "temperature", label: "Temperatur", value: "37,8", unit: "°C" },
          { id: "gcs", label: "GCS", value: "15", note: "Våken" },
        ],
      },
      questions: [
        {
          id: "pust-1",
          label: "Oppgave 1",
          prompt:
            "Forklar din umiddelbare vurdering, de mest sannsynlige årsakene til forverringen og dine tre første behandlingsprioriteringer.",
        },
      ],
    },
  ],
});

export const cases = [randiCase, dyspneaCase];
