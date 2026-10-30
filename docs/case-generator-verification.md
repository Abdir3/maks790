# Implementering og verifikasjon

Oppdatert 30. oktober 2026. Rapporten gjelder v3-implementeringen med Supabase som backend og direkte OpenAI-kall. Lovable brukes til publisering av nettsiden.

## Raskere generering, 30. oktober

### Bakgrunnskjøring og Ultrafast

Supabase har nå en egen autentisert worker, umiddelbar oppstart etter lagret jobb og en femsekunders tidsplan som fortsetter arbeidet uten nettleser. Statuskall starter ingen generering. Pågående og ferdig case hentes fra samme konto etter reload, ny fane eller innlogging på en annen enhet. Et uklart svar på første bestilling starter ikke automatisk et nytt betalt modellkall. Private sjekkpunkter slettes ved avslutning; varighet, antall modellsteg og faktisk behandlingstier beholdes som private driftsmålinger.

Generering bruker `gpt-6-astra`, medium resonnering og `service_tier: ultrafast`. Modell, prompt, skjema, kildegrunnlag, validering og reparasjonsgrense er uendret fra ettkallsversjonen nedenfor. Ultrafast koster mer per token. Behandlingstier er en serverinnstilling; tilbakemelding og modellbesvarelse bruker standardtier.

Faktisk Supabase-kjøring uten ett eneste klient-poll frem til ferdigstillelse, deretter gjenfinning ved separat innlogging:

| Case | Bestilling til tilgjengelig case | Modellkall |
| --- | ---: | ---: |
| Kort blodgass | 134,8 s | 1 |
| Kort sirkulasjon, kompleks | 29,4 s | 1 |
| Lang infeksjon, tre deler | 58,4 s | 1 |
| Lang sirkulasjon, seks deler, kompleks | 53,5 s | 1 |

Kjøring `eed831cd-2abe-44fe-925e-afce00518d29` kontrollerte også biblioteklagring, repetert bestilling uten duplikat, eierisolasjon, privat vurderingsgrunnlag og avvisning av uautorisert worker-kall. Alle fire ble ferdige innen målene på 150/180 sekunder. Dette er fire ulike kasus, ikke en p95-måling eller garanti mot senere leverandørforsinkelse.

Reell lokal frontend mot den deployede Supabase-backenden: **37,6 sekunder fra knappetrykk til åpent arbeidsrom**. Neste case ble startet, dialogen lukket og alle nettleserfaner stengt. Serveren fullførte på 33,8 sekunder. En separat mobilkontekst (390 px), uten tidligere lokal lagring, logget inn på samme konto, fant «Casen er klar» og åpnet den uten overflyt eller nettleserfeil. Kjøring `937f9bdd-87dc-4eac-a5d7-b97d883a26b5`. Dette bekrefter den nye frontendkoden, ikke at Lovable allerede har publisert den.

Claude Desktop ble konsultert i to runder om tidsmål, kontinuitet, bakgrunnskjøring og feiltester. Etter målingen på 66,5 sekunder for en lokal seksdelt Ultrafast-case anbefalte Claude å beholde én sammenhengende generering. Forslaget om å vise et ugyldig utkast ved tidsfrist ble avvist; kvalitetsporten består. Strukturell kontroll av de fire produksjonscasene fant bevart oppgavebredde, tidslinje, legemidler, blodgass, tolkede undersøkelser og privat vurderingsgrunnlag med gyldige kilde-ID-er. Dette er ikke uavhengig klinisk ekspertvurdering.

### Tidligere ettkallsversjon på standardtier

Den interaktive generatoren bruker nå ett Astra-kall ved gyldig første forslag. Separat blindløsning og modellkritikk er fjernet fra ventetiden; de finnes fortsatt som eksplisitt valg i kalibreringsverktøyet. Modellen, resonneringsnivået, prompten, pensumgrunnlaget og de raske kodede kontrollene er beholdt. Lagringen merker nye vurderingsgrunnlag `automatic`, uten å fabrikere en bestått modellkontroll. Eldre vurderingsgrunnlag kan fortsatt leses.

Tre faktiske genereringer via Supabase brukte ett modellkall hver: kortcase med blodgass 101,9 sekunder, kortcase med sirkulasjon 71,1 sekunder og langcase med tre deler 173,0 sekunder. Den tidligere kjøringen brukte 145,8 sekunder for blodgasskortcasen og 406,8 sekunder for langcasen med samme format- og temavalg. Dette er ulike genererte caser og få målinger, ikke en garantert svartid eller et kontrollert kvalitetsstudium. Ny kjøring: `f8c5c2cf-db91-404d-ac15-6fc96e498578`.

Fremdriftsvisningen får faktiske faser fra serveren: mottatt, under skriving, eventuell retting og ferdig. Den viser en animert caseillustrasjon og faktisk medgått tid, uten en oppdiktet prosent. Ingen utkast eller privat fasit inngår i fremdriftssvarene. Lokal nettlesertest med simulerte serversvar kontrollerte oppstart, sperring av dobbeltklikk, fasebytte, feil, nytt forsøk og automatisk åpning; også 390 px mobil, 200 % tekst og redusert bevegelse. Dette er ikke en test av den publiserte frontendversjonen.

## Implementert

- Komplette kortcaser med 2–4 spørsmål og lange caser med 3–6 deler (standard fire). Alle deler åpne fra start.
- Strukturert sykehistorie, legemidler med dose/tid, undersøkelse, vitale parametre, laboratorier, blodgass og tolkede EKG-/bilderapporter.
- Faktisk HCO₃⁻ og standard BE(Ecf) beregnes deterministisk fra de samme primærverdiene som vises. Referanseinformasjon skiller arterielt/venøst og forklarer alders-/metodebegrensninger.
- Helhetlig AI-tilbakemelding og begrunnet modellbesvarelse uten innlevering. Tidlig åpning markeres «Øvd med løsningsforslag» i lokal kladd; endrede svar gjør tidligere tilbakemelding utdatert.
- Oppgavespesifikt tidspunkt: at-time bruker sin tidsavgrensede visning; whole-case bruker hele casen.
- Pensumstyrte kliniske rammer med faktiske sykdomsfamilier, mekanismer, presentasjoner, avgjørende funn og resonneringsmål.
- Privat lagring av vurderingsgrunnlag og variasjonsmetadata, eierkontroll og atomisk lagring. Eldre case-/spørsmåls-ID-er og lokale kladder beholdes.

## Kontrollkjeden

1. Strengt JSON-skjema og validering av alder, ramme, oppgaveantall, tidslinje, komplette vitalia, enheter, oksygenkontekst og kilde-ID-er.
2. Blodgassberegning og normalisering av tidspunkt/visningspresisjon.
3. Kontroll av likhet med tidligere caser.
4. Ett reparasjonsforsøk ved konkret valideringsfeil. Ved fortsatt feil vises og lagres ingen case.
5. Tilbakemelding/modellbesvarelse bruker samme lagrede private basis, valideres og gjennomgår egen kritikk når studenten ber om dem. Historiske doser og studentsitater tillates; nye eksakte behandlingsråd vurderes mot konkret kildedekning.

Bare den separate kalibreringskjøringen bestiller en uavhengig løsning fra studentvisningen og en ekstra modellkritikk før godkjenning.

Modellkontroll er ikke klinisk fagpersonsignering. Se `curriculum.md` og `case-generator-analysis.md` for kildeomfang og pedagogisk begrunnelse.

## Faktisk verifikasjon

Siste samlede kjøring: **120 tester bestått, 0 feilet**, med PGlite-testene aktivert. TypeScript, produksjonsbygg, ESLint for alle endrede kodefiler og `git diff --check` er bestått. Simulerte modellsvar er tekniske tester, ikke klinisk kalibrering.

ESLint er kjørt på de endrede kodefilene. Den tidligere kjøringen av hele prosjektet hadde eksisterende feil i automatisk genererte Supabase-filer og komponentadvarsler. Nettleserpakken er undersøkt for servernøkkelnavn og private serverkall; ingen slike treff ble funnet.

- PostgreSQL-migreringen er kjørt i isolert PGlite med roller, RLS og reelle SQL-operasjoner: privat SELECT/RPC og offentlig UPDATE avvises for vanlig bruker; annen bruker ser ikke casen; atomisk lagring og rollback ved feil i andre innsetting er testet; sletting kaskaderer; eldre ID-er/spørsmål bevares.
- Nettleser: ny langcase åpner «Hele casen», siste del/spørsmål kan velges direkte, kortcase viser løsning med tom besvarelse før fullføring, markeringen overlever reload, endret svar utløser ny tilbakemelding, eldre v2-case har alle deler åpne uten nye AI-knapper.
- Mobil: laboratoriesvar og referanseinformasjon kontrollert ved 390 px, også 200 % tekst. En avkuttet bakgrunnsoverskrift ble rettet. Diktering er kontrollert med testens simulerte transkripsjon; dette er ikke en test av faktisk mikrofon eller ElevenLabs.
- Automatisk testsett omfatter også blodgassregning, blandingsforstyrrelser, originalens inkonsistente tabellrad, nested privatfelt-filtrering, ordrette sitater, tomme svar, temporalScope, lagrings-/eierfeil, modellreparasjon og avbrutte datastrømmer.

## Klinisk kalibrering

Første sett omfatter åtte kortcaser og tre langcaser med ulike resonneringsprofiler. Kalibreringsverktøyet kjører den faktiske genererings-/kontrollkjeden og kan prøve gode, delvise, forsvarlige alternative og uforsvarlige besvarelser. Modellskrevne prøvesvar er ikke ekspertfasit.

Kalibreringsverktøyet bruker samme modell som produksjonskonfigurasjonen og bestiller eksplisitt de ekstra modellkontrollene. Det tester promptene, kontraktene og orkestreringen; det beviser ikke innlogging eller Supabase-lagring. Private testcaser og vurderingsgrunnlag skal ikke sjekkes inn i Git eller blandes med studentbiblioteket.

De endelige **åtte kortcasene og tre langcasene** har passert den faktiske v3-kjeden via direkte OpenAI med `gpt-6-astra`. Én kortcase og én langcase er også prøvd med modellbesvarelse og alle fire svarprofiler. Dette er modellbasert innholdskontroll, ikke klinisk ekspertgodkjenning eller en produksjonstest.

Testene avdekket for få tillatte blodgasser og tekstgrenser som kunne kutte rolletekst og tekstlige prøvesvar. Kontrakten er rettet, og berørte caser kjørt på nytt. Et for svakt avgrenset kildegrunnlag for nyreskade/legemidler ble styrket før den endelige geriatriske casen. Forkastede forslag er bevart; de ble ikke lagret som brukercaser. Reparasjon får både feilbeskrivelsen og det avviste utkastet, og må passere hele kontrollkjeden på nytt.

Se [kalibreringsrapporten](case-calibration.md) for forsøksantall, svarprofilutfall og begrensninger. Ingen gammel v2-modelltest regnes som bestått v3-kalibrering.

## Drift

Migreringen `supabase/migrations/20261028010000_private_case_assessments.sql` må kjøres i måldatabasen før denne appversjonen aktiveres. Den flytter eksisterende skjult grunnlag til privat tabell og fjerner offentlig skriverett for vanlige brukere. Deploy av app og database må derfor koordineres; den eldre skriveruten kan ikke brukes etter migreringen.

Supabase-funksjonen bruker prosjektets databasetilkobling og `OPENAI_API_KEY` fra Supabase-hemmeligheter. Diktering går også direkte til OpenAI. Lovable trenger ingen AI-nøkkel eller privilegert databasenøkkel. Hemmelige nøkler skal aldri ha `VITE_`-prefiks. Se README for bygging og deploy.

Backend og jobbmigrering er installert på Supabase. Faktiske tester bruker egne midlertidige testkontoer med automatisk opprydding, adskilt fra brukerens bibliotek.

Modellkall gjenopptas med private sjekkpunkter og låsing av jobben på Supabase. Hver funksjonskjøring gjør høyst ett leverandørkall; ferdige svar gjenbrukes ved polling. Kladd og markering lagres i samme nettleser, ikke på tvers av enheter. Tilbakemelding og modellbesvarelse genereres ved forespørsel og er ikke en permanent sensurhistorikk.

Endringer til frontend må synkroniseres fra GitHub `main` og publiseres via Lovable. En Supabase-deploy oppdaterer ikke den publiserte frontendversjonen.
