# Implementering og verifikasjon

## Kandidat V4 – gjennomgang 29.–30. oktober 2026

Kandidaten ligger på `codex/generator-quality-audit`, med utgangspunkt i
publisert revisjon `2b558078c28346792fd2e6bb2a4b1101650af4e9`.
Den er ikke publisert. Endringene krever ingen ny SQL-migrering.

### Endret atferd

- Kortcaser har normalt to, høyst tre fokuserte spørsmål. Instruks og
  kontroll avviser store skjulte deloppgaver og spørsmål som røper den
  kliniske beslutningen. Målet er 150–250 ord kasustekst pluss nødvendige
  data; 10–15 minutter er ikke studentmålt.
- Katalogen har 53 scenarioer, inkludert anafylaksi hos voksne. Bronkiolitt
  er avgrenset til første leveår. Barnetriage er et langformat med likeverdige
  innledende presentasjoner og senere tydelig atskilte pasientopplysninger.
- Avgrensede primærkilder styrker kliniske og rettslige vurderinger.
  Nye kilde-ID-er bevarer omfanget til lagrede V3-caser. Ukjente versjoner
  avvises fortsatt. Kilderegisteret har 85 poster; alle 44 opprinnelige
  kildeomfang er kontrollert uendret mot den publiserte revisjonen.
  Undersøkelseskrav tilpasses den konkrete beslutningen: nødvendig
  årsaksdiagnostikk skal være komplett, mens en innledende hasteoppgave
  kan gjelde før alle prøver eller rapporter foreligger.
- Tomme enkeltbesvarelser får ingen generert fasit eller vurderingsråd.
  Korte faktiske svar vurderes. Oppsummeringen skal heller ikke røpe svar
  på ubesvarte spørsmål. Forsvarlige alternativer skal vurderes på
  begrunnelsen, og valgfrie forbedringer skilles fra nødvendige mangler.
  Alternativfelt kan være tomme når spørsmålet ikke har et meningsfullt
  alternativ; kommunikasjon skal ikke få en oppdiktet diagnoseoppgave.
  Nødvendige sikkerhetstiltak må dekkes av selve spørsmålet, slik at en ren
  tolkningsoppgave ikke får en skjult tiltaksplan som sensorkrav. Faktisk
  uforsvarlige påstander korrigeres fortsatt. Metodeforbehold vurderes mot
  oppgavens krav om en konkret konklusjon, uten krav om unødig gjentakelse.
- Oppgitte GCS-delskårer kontrolleres aritmetisk når én entydig E-, V- og
  M-verdi finnes. Tekstlig våkenhet omgjøres ikke automatisk til en skår.
  Medikamentpresentasjonen unngår dobbel tegnsetting; blodgassverdier
  bruker norsk desimalskilletegn og tydelig lokal/aldersavhengig referanse.
  Små barns alder vises i fullførte måneder, dager eller timer uten
  avrunding over en klinisk aldersgrense.
- Kreditt-, hastighets-, autentiserings- og tidsfeil skilles uten å vise
  rå modelltekst eller leverandørens private feildata. Faktisk returnert
  modellnavn og begrenset bruksmetadata bevares privat når tilgjengelig.
- Kalibrering kan velge kjernesettet eller hele katalogen. Gjenopptaking
  bindes til implementasjonskode, kilder, leverandør og utvalg. Leverandørfeil
  stopper resten av batchen; uforsøkte caser telles ikke som kliniske feil.
  Resultatmapper uten opprinnelig manifest kan ikke gjenopptas som en
  verifisert kjøring.

### Teknisk kontroll av kandidaten

Kontrollert 30. oktober: **102 tester bestått, 0 feilet, ingen hoppet over**,
med PGlite aktivert. PostgreSQL-kontrollen prøver reelle roller, RLS,
atomisk lagring/rollback, sletting og bevaring av eldre data i en isolert
database. TypeScript, ESLint for alle endrede kodefiler og produksjonsbygg
er bestått. Prosjektets lint uten lokale arbeidsmapper har 98 eksisterende
feil i fire uendrede genererte Supabase-filer og seks komponentadvarsler.
Bygget har fortsatt verktøyadvarsler om
eksisterende konfigurasjon/deprekerte API-er; det er ingen byggefeil.
Nettleserpakken er undersøkt for servernøkkelnavn, privat lagring og
genererings-/kontrollprompter uten treff. Dette er en avgrenset
pakkeinspeksjon, ikke en full sikkerhetsrevisjon.

33 lagrede eksempler passerte de nye deterministiske strukturkontrollene;
ett annet eksempel kunne ikke kontrolleres slik fordi scenario-ID manglet.
Dette var gamle resultater, ikke nye genereringer eller ny klinisk validering.
Ingen nettleser-/mobiltest av V4 er gjennomført: nettleserstyring var
deaktivert. Den historiske nettlesertesten nedenfor gjelder V3.

### Faktiske modell- og produksjonstester

V3-baseline ga 23 nye aksepterte caser: åtte via direkte OpenAI og femten
via den publiserte appen. 40 fullførte direkte responser oppga faktisk
`gpt-6-astra`. Produksjonen var konfigurert for Astra, men bevarte ikke
samme modellmetadata. Alle 23 caser ble lest manuelt, og et bredt utvalg
ble diskutert med faktisk Claude Desktop. I tillegg ble 23 målrettede
produksjonstilbakemeldinger gjennomgått og elleve historiske caser lest
på nytt. Tall og konkrete utfall står i
[kalibreringsrapporten](case-calibration.md).

Produksjonens oppretting, privat basis, tilbakemelding, modellbesvarelse,
eieravgrensning, bibliotek og sletting ble prøvd med syntetiske testbrukere.
Testbrukerne og dataene deres er slettet, og opprydding er kontrollert.
Dette er faktisk ende-til-ende-verifikasjon av den publiserte V3-revisjonen,
ikke av den lokale V4-kandidaten.

Direkte OpenAI og deretter Lovable AI gikk tomme for kreditt. Den allerede
startede direkte katalogbatchen fortsatte først til flere leverandørfeil;
dette avdekket manglende stopp ved kredittfeil, som nå er rettet og testet.
Kallene ble deretter stanset, og ingen kreditt ble kjøpt.
Kandidatens endelige prompt, nye kilder og triageformat mangler derfor
en ny faktisk Astra-kjøring. Forberedte juridiske/pediatriske utfordringer
er ikke rapportert som beståtte tester. Neste utrulling må prøves med
disse endringene før den kan omtales som modellverifisert. Enighet mellom
modeller er ikke klinisk fagpersonsignering.

## Historisk verifikasjon av V3 – 28. oktober 2026

Resten av dokumentet bevarer statusen fra 28. oktober. Tilgangsbegrensninger,
testtall, nettleserfunn og branchopplysninger her gjelder den kjøringen,
ikke den nye kandidaten.

### Implementert da

- Komplette kortcaser med 2–4 spørsmål og lange caser med 3–6 deler (standard fire). Alle deler åpne fra start.
- Strukturert sykehistorie, legemidler med dose/tid, undersøkelse, vitale parametre, laboratorier, blodgass og tolkede EKG-/bilderapporter.
- Faktisk HCO₃⁻ og standard BE(Ecf) beregnes deterministisk fra de samme primærverdiene som vises. Referanseinformasjon skiller arterielt/venøst og forklarer alders-/metodebegrensninger.
- Helhetlig AI-tilbakemelding og begrunnet modellbesvarelse uten innlevering. Tidlig åpning markeres «Øvd med løsningsforslag» i lokal kladd; endrede svar gjør tidligere tilbakemelding utdatert.
- Oppgavespesifikt tidspunkt: at-time bruker sin tidsavgrensede visning; whole-case bruker hele casen.
- Pensumstyrte kliniske rammer med faktiske sykdomsfamilier, mekanismer, presentasjoner, avgjørende funn og resonneringsmål.
- Privat lagring av vurderingsgrunnlag og variasjonsmetadata, eierkontroll og atomisk lagring. Eldre case-/spørsmåls-ID-er og lokale kladder beholdes.

### Kontrollkjeden da

1. Strengt JSON-skjema og validering av alder, ramme, oppgaveantall, tidslinje, komplette vitalia, enheter, oksygenkontekst og kilde-ID-er.
2. Blodgassberegning og normalisering av tidspunkt/visningspresisjon.
3. Uavhengig løsning fra bare studentvisningen: avgjørende datamangler og ren avskrift avvises.
4. Separat modellkritikk av klinisk sammenheng, kompletthet, fysiologi, kildeomfang, alternativer, tidsavgrensning og faktisk variasjon. Alle kontrollpunkter må godtas.
5. Ett reparasjonsforsøk. Ved fortsatt feil vises og lagres ingen case.
6. Tilbakemelding/modellbesvarelse bruker samme lagrede private basis, valideres og gjennomgår egen kritikk. Historiske doser og studentsitater tillates; nye eksakte behandlingsråd vurderes mot konkret kildedekning.

Modellkontroll er ikke klinisk fagpersonsignering. Se `curriculum.md` og `case-generator-analysis.md` for kildeomfang og pedagogisk begrunnelse.

### Faktisk verifikasjon da

Siste samlede kjøring: **76 tester bestått, 0 feilet**, med PGlite-testen aktivert. TypeScript, produksjonsbygg, ESLint for alle endrede kodefiler og `git diff --check` er bestått. Simulerte modellsvar er tekniske tester, ikke klinisk kalibrering.

Hele prosjektets ESLint har fortsatt 92 eksisterende feil i fire uendrede, automatisk genererte Supabase-filer og seks eksisterende komponentadvarsler. Disse er skilt fra de endrede filenes beståtte kontroll. Nettleserpakken er undersøkt for servernøkkelnavn, privat lagring og genererings-/kontrollprompter; ingen slike treff ble funnet.

- PostgreSQL-migreringen er kjørt i isolert PGlite med roller, RLS og reelle SQL-operasjoner: privat SELECT/RPC og offentlig UPDATE avvises for vanlig bruker; annen bruker ser ikke casen; atomisk lagring og rollback ved feil i andre innsetting er testet; sletting kaskaderer; eldre ID-er/spørsmål bevares.
- Nettleser: ny langcase åpner «Hele casen», siste del/spørsmål kan velges direkte, kortcase viser løsning med tom besvarelse før fullføring, markeringen overlever reload, endret svar utløser ny tilbakemelding, eldre v2-case har alle deler åpne uten nye AI-knapper.
- Mobil: laboratoriesvar og referanseinformasjon kontrollert ved 390 px, også 200 % tekst. En avkuttet bakgrunnsoverskrift ble rettet. Diktering er kontrollert med testens simulerte transkripsjon; dette er ikke en test av faktisk mikrofon eller ElevenLabs.
- Automatisk testsett omfatter også blodgassregning, blandingsforstyrrelser, originalens inkonsistente tabellrad, nested privatfelt-filtrering, ordrette sitater, tomme svar, temporalScope, lagrings-/eierfeil, modellreparasjon og avbrutte datastrømmer.

### Klinisk kalibrering da

Første sett omfatter åtte kortcaser og tre langcaser med ulike resonneringsprofiler. Kalibreringsverktøyet kjører den faktiske genererings-/kontrollkjeden og kan prøve gode, delvise, forsvarlige alternative og uforsvarlige besvarelser. Modellskrevne prøvesvar er ikke ekspertfasit.

Den lokale OpenAI-tilkoblingen kan brukes med samme modell som produksjonskonfigurasjonen. Det tester promptene, kontraktene og orkestreringen; det beviser ikke produksjonens Lovable-gateway, innlogging eller Supabase-lagring. Private testcaser og vurderingsgrunnlag skal ikke sjekkes inn i Git eller blandes med studentbiblioteket.

De endelige **åtte kortcasene og tre langcasene** har passert den faktiske v3-kjeden via direkte OpenAI med `gpt-6-astra`. Én kortcase og én langcase er også prøvd med modellbesvarelse og alle fire svarprofiler. Dette er modellbasert innholdskontroll, ikke klinisk ekspertgodkjenning eller en produksjonstest.

Testene avdekket for få tillatte blodgasser og tekstgrenser som kunne kutte rolletekst og tekstlige prøvesvar. Kontrakten er rettet, og berørte caser kjørt på nytt. Et for svakt avgrenset kildegrunnlag for nyreskade/legemidler ble styrket før den endelige geriatriske casen. Forkastede forslag er bevart; de ble ikke lagret som brukercaser. Reparasjon får både feilbeskrivelsen og det avviste utkastet, og må passere hele kontrollkjeden på nytt.

Se [kalibreringsrapporten](case-calibration.md) for forsøksantall, svarprofilutfall og begrensninger. Ingen gammel v2-modelltest regnes som bestått v3-kalibrering.

### Drift og tilgang ved den historiske kjøringen

Migreringen `supabase/migrations/20261028010000_private_case_assessments.sql` må kjøres i måldatabasen før denne appversjonen aktiveres. Den flytter eksisterende skjult grunnlag til privat tabell og fjerner offentlig skriverett for vanlige brukere. Deploy av app og database må derfor koordineres; den eldre skriveruten kan ikke brukes etter migreringen.

Serveren trenger eksisterende `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` og `LOVABLE_API_KEY`. Hemmelige nøkler skal aldri ha `VITE_`-prefiks. Den nye private lagringen trenger ingen `CASE_ASSESSMENT_KEY`; eldre krypterte data arkiveres uten å bli gjenbrukt som ny fasit. Diktering bruker fortsatt eksisterende `ELEVENLABS_API_KEY`.

Ingen produksjonsdatabase er endret i denne lokale testkjøringen. Faktisk Lovable/Supabase ende-til-ende-test krever prosjekttilgang og en innlogget testbruker. Verken denne tilkoblingen eller produksjonens servernøkler er tilgjengelige lokalt. Tilgjengelig OpenAI-nøkkel erstatter ikke dem.

Lange modellkall kan ta flere minutter; faktisk hostinggrense må prøves. Ingen vedvarende jobbkø/gjenopptaking eller distribuert kostnadskvote er lagt til. Kladd og markering lagres i samme nettleser, ikke på tvers av enheter. Tilbakemelding og modellbesvarelse genereres ved forespørsel og er ikke en permanent sensurhistorikk.

Endringen leveres på `codex/case-quality` i eksisterende utkast-PR. Push oppdaterer kodegjennomgangen; det er ikke bekreftet publisering av nettstedet.
