# Pensumgrunnlag og klinisk variasjon

Versjon: `exam-info-2026-10-28-v3`.

Studieheftet er utgangspunktet for læringsutbytte og undervisningsbredde.
Arbeidskrav 1 og 2 behandles som tidligere eksamenseksempler etter brukerens
opplysning. De viser nivå, oppgavetyper og integrasjon, men gir verken
behandlingsfasit eller sannsynligheten for et bestemt eksamenstema. Randi
viser blant annet vurdering før ankomst, utskrivelse, funksjon, legemidler
og ny sykdomsutvikling. Selvskadematerialet viser relasjon, kommunikasjon
og vurdering av suicidalitet.

Den nåværende katalogen har 52 kliniske scenarioer, 14 faglige temaer og
ett valgbart blodgasstema som bruker de samme kliniske scenarioene.
Hvert scenario har to sammenhengende vurderingsmål. Dette er et utvalg
for øving, ikke en påstand om full dekning av alt pensum.

## Fra kilde til vurderingsmål

Sidene nedenfor er kompendiets trykte sidetall, ikke PDF-viserens sidenummer.
Den konkrete koblingen til funn, data og kilder finnes i
`CLINICAL_BLUEPRINTS` i `src/lib/case-variety.ts`. Kilderegisteret er
`src/lib/case-sources.server.ts`.

| Tema                     | Primært pensumgrunnlag                         | Eksempler i katalogen                                                                    | Hva studenten vurderer                                                                      |
| ------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Sirkulasjon/respirasjon  | Studieplan, kompendium 118–175 og 176–185      | Koronarsykdom, hjertesvikt, emboli, kols, astma, synkope                                 | Sammenhengen mellom symptomer, tolket EKG, laboratoriedynamikk, oksygenering og ventilasjon |
| Infeksjon/sjokk          | Studieplan, 118–175, 344–347                   | Lunge-/urinveisfokus ved sepsis, hypovolemisk sjokk                                      | Fokus, organsvikt, perfusjon, respons og prioritering                                       |
| Barn                     | Arbeidskrav 1, 99–117                          | Bronkiolitt, laryngitt, dehydrering, prioritering av flere barn                          | Alder, foreldrenes observasjoner, kontakt, pust og hydrering                                |
| Geriatri                 | Randi, 176–189                                 | Delirium, akutt nyreskade, retensjon, hoftebrudd                                         | Endring fra baseline, flere samtidige årsaker, legemidler og trygg overgang                 |
| Traume/nevrologi         | Studieplan/NIHSS, 208–212, 344–347             | Slag, hodeskade, blødningssjokk                                                          | Debut/mekanisme, nevrologi, blødning, kliniske prioriteringer og overlevering               |
| Endokrinologi/væske      | 57–77, 118–161                                 | DKA, SGLT2-assosiert DKA, HHS, hypoglykemi, binyrebarkkrise, natrium-/kaliumforstyrrelse | Årsak, syre-base, elektrolytter, legemidler og overvåking                                   |
| Abdomen                  | Studieplan, kasus i 118–161, 44–56             | Ileus, peritonitt/abdominal sepsis, blødning                                             | Abdominalfunn, bilderapporter, væsketap og organpåvirkning                                  |
| Psykisk helse/somatikk   | Selvskadematerialet, 262–288, 400–463          | Selvskading, spiseforstyrrelse, delirium med psykiatrisk sykehistorie                    | Somatisk vurdering, allianse, individuell vurdering og konkret beskyttelsesbehov            |
| Rus/smerte               | 213–261, 289–311, 348–375, 464–487             | Opioidforgiftning, alkoholabstinens, alkoholisk ketoacidose, LAR og smerter              | Eksponering og toleranse, ventilasjon, metabolsk sykdom, lindring og stigma                 |
| Behandlingsmål/pårørende | Arbeidskrav 1, 1–17, 489–507                   | Reversibel forverring, kreftsmerter, brå død                                             | Nytte/belastning, pasientmål, funksjon, familie og oppfølging                               |
| Vold/kommunikasjon       | Arbeidskrav 1, 190–200, 376–399                | Skade etter vold, samtale med språkbarriere                                              | Trygghet, pasientens historie, forståelse, beslutningskompetanse og overlevering            |
| Kreftkomplikasjoner      | 489–507, særlig 496–499                        | Medullakompresjon, hyperkalsemi, infeksjon ved nøytropeni                                | Akutt komplikasjon versus progresjon, funksjon, medisiner og behandlingsmål                 |
| ØNH                      | 78–98, særlig visuelt leste 95–97              | Tonsillitt, peritonsillær abscess, mononukleose                                          | Lokal versus systemisk sykdom, luftvei, drikkeevne og testresultater                        |
| Postoperative problemer  | Visuelt leste 44–56                            | Hypoventilasjon, lungekomplikasjon, ileus                                                | Kirurgisk stress, bivirkninger, smerte, mobilitet og ernæring                               |
| Blodgass                 | 118–175, supplerende metode-/laboratoriekilder | Gasser innen respiratoriske, metabolske, sirkulatoriske og toksiske scenarioer           | Primær forstyrrelse, kompensasjon, blandede tilstander, årsak og klinisk betydning          |

Blodgass tolkes av studenten. EKG presenteres som en allerede klinisk
tolket rapport som skal integreres med resten av funnene. Dette er en
produktavgrensning valgt av brukeren; studieplanens EKG-workshop dokumenterer
ikke at rå EKG-tolkning er utelukket fra den offisielle eksamenen.

## Komplette casepresentasjoner

Alle opplysninger nødvendige for oppgaven skal finnes i casen: relevant
sykehistorie, funksjon, medisiner, funn, vitalia og prøvesvar. Studenten
skal ikke måtte be en chatbot om det avgjørende prøvesvaret. Fullstendighet
betyr at oppgaven er besvarbar, ikke at alle pasienter får alle undersøkelser.
For barn angis konkret alder i måneder/døgn når hele år er utilstrekkelig.

Medikamenthistorikk beholder doser, enheter, administrasjonsmåte,
hyppighet, siste inntak og endringer. Historie og allerede gjennomført
behandling skilles fra nye anbefalinger. Resultater, tiltak og respons
tidfestes eksplisitt. Senere prøver kan vises i en komplett tidslinje,
men er ikke bevis for hva som var kjent på et tidligere tidspunkt.

Kortformatet trener et avgrenset klinisk problem med diagnostisk
resonnement og relevante prioriteringer. Langformatet integrerer flere
beslektede kliniske og menneskelige hensyn. En komplett case kan fortsatt
ha flere forsvarlige tolkninger eller handlingsalternativer. Det skal ikke
skapes kunstig usikkerhet ved å skjule nødvendige opplysninger.

Scenarioet om brå død finnes bare i langformatet. Det begynner med et
beskrevet akutt pasientforløp og tidfestede premortale målinger før
pårørendearbeidet. Samtaledeler etter bekreftet død skal ikke få oppdiktede
nye pasientvitalia. Det samme relevansprinsippet gjelder andre senere deler:
komplette nødvendige data innebærer ikke en ny full måleserie i hver del.

## Variasjon og kompatibilitet

Variasjon bygger på diagnose-/problemfamilie, mekanisme, vurderingsmål
og avgjørende evidens. Alder, navn, setting og ny formulering av samme
forløp gir ikke en ny semantisk identitet. Kommunikasjons-/pårørendeoppgaver
har en klinisk problemfamilie fremfor en kunstig sykdomsdiagnose.

Systemet balanserer temaer i historikken, foretrekker usette kombinasjoner
og demper nylig gjentatte familier. Når et avgrenset temas alternativer er
brukt, tillates gjenbruk. Vanlige diagnoser er aldri permanent svartelistet.
Dette er pedagogisk variasjon, ikke prevalens- eller eksamensstatistikk.

`diagnosis_family` i ny privat historikk betyr faktisk problemfamilie.
`fingerprint` lagres separat. Eldre v2-historikk som plasserte en
fingerprint i dette feltet leses kun for å unngå gjentakelse.

`isTopicSettingCompatible` og selve trekningen bruker samme regler.
Sykehjem krever en kompatibel voksen/eldre situasjon, KAD voksen alder,
og scenarioer med påkrevd blodgass bruker akuttmottak, sengepost eller
legevakt med oppgitt prøvetilgang. Telefoncaser brukes til passende
kommunikasjonssituasjoner. Format inngår i den samme kompatibilitetsregelen.
Testutvelgelse kan bruke `blueprintId`; den omgår ikke alder-, tema-, format-
eller settingreglene.

## Blodgassberegning

`blood-gas.ts` bruker [Radiometer ABL90 FLEX IFU](https://www.ruh.nhs.uk/pathology/documents/poct/SOP_Radiometer_ABL90_Flex_IFU_Instructions.pdf),
kapittel 11, trykt side 277, ligning 4 og 7, kontrollert 28.10.2026.
Ved 37 °C, pCO₂ i kPa:

```
Aktuelt plasma-HCO₃⁻ = 0,23 × pCO₂ × 10^(pH − 6,095)
SBE(Ecf) = HCO₃⁻ − 24,8 + 16,2 × (pH − 7,4)
```

Utgangsverdiene er pH, pCO₂ og pO₂ med prøvetype, tidspunkt og
oksygenkontekst. HCO₃⁻ og SBE beregnes deterministisk, i mmol/L, med
presisjon beholdt frem til visning. Dette er aktuelt HCO₃⁻, ikke
standardbikarbonat; SBE(Ecf), ikke hemoglobinavhengig BE(B).
Sammenligning av importerte beregnede verdier tillater 0,11 mmol/L for
avrunding til én desimal. Kontrollene er ikke en fysiologisk diagnose:
blandede forstyrrelser og kronisk kompensasjon tillates. Ingen eksakt
identitet mellom respirasjonsfrekvens og pCO₂, venøs og arteriell gass,
eller SpO₂ og pO₂ håndheves.

Referansetekst kommer fra [Sykehuset Østfolds laboratoriebok](https://labfag.no/emne/ckcc7Kac)
(07.10.2026). Den merkes som lokal og metodeavhengig; pediatriske og
neonatale forbehold vises. Venøs pO₂ får ikke arteriell normalgrense.
Laboratoriets generelle BE-intervall hevdes ikke å være en separat
validert referanse for den konkrete SBE(Ecf)-beregningen.

## Kildenes roller og kjente begrensninger

Kilderegisteret gir konkrete diagnostiske holdepunkter og relevante
behandlingsprinsipper. Aktuelle norske primærkilder inkluderer
Helsedirektoratets anbefalinger, OUS' metodebøker, sykehuslaboratorier,
Giftinformasjonen og Felleskatalogens preparatomtaler. Britiske NICE-kilder
merkes med populasjon og setting. En kontrollert lenke betyr ikke at hver
anbefaling på nettsiden ble oppdatert samme dag.

Scenarioet om akutt nyreskade har også
[OUS' nyreskadekapittel](https://metodebok.no/index.php?action=topic&item=YwXG8gK3)
og [Ibux med DMPs interaksjonstekst](https://www.felleskatalogen.no/medisin/ibux-karo-pharma-559957)
for legemiddel-/volumvurderingen. OUS-avsnittene ble kontrollert i søkeindeksert
kildetekst; direkte oppslag ga 403. Felleskatalogteksten ble åpnet og lest.

Presise nye behandlingsdoser, væske-/elektrolytthastigheter og rettslige
påstander trenger eksplisitt støtte for den aktuelle pasienten og
settingen. Dette er ikke et forbud mot doser i medikamenthistorikken eller
mot klinisk innhold. Gamle danske bokregimer overføres ikke automatisk
til norsk praksis. Den gjeldende kommentaren til § 4-3 bruker
beslutningskompetanse etter endringen 1. juni 2026.

Kjente avvik i primærmaterialet:

- Original tabell 4.4D, trykt side 150, oppgir pH 7,55, pCO₂ 1,4,
  HCO₃⁻ 1 og BE −30. Originalbildet er kontrollert. Tallene er innbyrdes
  inkonsistente og brukes som negativ test, ikke som fasit.
- Randi-materialet fastslår ikke entydig målingenes timing i forhold til
  morfin. Påstanden om at disse nødvendigvis var før morfin er trukket.
- Trykt 95–97 tilhører ØNH, ikke Markestad. Sidene er visuelt lest.
- Hele de bildebaserte kapitlene 44–56 og 489–507 er visuelt lest.
- Full Sheehy, Canvas/Leganto og selvvalgt pensum er ikke gjennomgått.
  Enkelte henviste bokkapitler ligger utenfor den tilgjengelige samlingen.

En bestått automatisk konsistens-/kildekontroll er ikke klinisk godkjenning.
Den uavhengige casekontrollen må fortsatt vurdere diagnoser, manglende
opplysninger, plausible alternativer, tidslinje og kildebruk. Kalibrering
med et begrenset antall genererte caser dokumenterer disse eksemplene,
ikke alle fremtidige kombinasjoner.
