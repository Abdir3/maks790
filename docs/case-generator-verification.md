# Implementering og verifikasjon

Revidert 28. oktober 2026. Denne rapporten gjelder den nye v3-implementeringen og erstatter testkonklusjonene for den tidligere trinnvise versjonen.

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
3. Uavhengig løsning fra bare studentvisningen: avgjørende datamangler og ren avskrift avvises.
4. Separat modellkritikk av klinisk sammenheng, kompletthet, fysiologi, kildeomfang, alternativer, tidsavgrensning og faktisk variasjon. Alle kontrollpunkter må godtas.
5. Ett reparasjonsforsøk. Ved fortsatt feil vises og lagres ingen case.
6. Tilbakemelding/modellbesvarelse bruker samme lagrede private basis, valideres og gjennomgår egen kritikk. Historiske doser og studentsitater tillates; nye eksakte behandlingsråd vurderes mot konkret kildedekning.

Modellkontroll er ikke klinisk fagpersonsignering. Se `curriculum.md` og `case-generator-analysis.md` for kildeomfang og pedagogisk begrunnelse.

## Faktisk verifikasjon

Siste samlede kjøring: **76 tester bestått, 0 feilet**, med PGlite-testen aktivert. TypeScript, produksjonsbygg, ESLint for alle endrede kodefiler og `git diff --check` er bestått. Simulerte modellsvar er tekniske tester, ikke klinisk kalibrering.

Hele prosjektets ESLint har fortsatt 92 eksisterende feil i fire uendrede, automatisk genererte Supabase-filer og seks eksisterende komponentadvarsler. Disse er skilt fra de endrede filenes beståtte kontroll. Nettleserpakken er undersøkt for servernøkkelnavn, privat lagring og genererings-/kontrollprompter; ingen slike treff ble funnet.

- PostgreSQL-migreringen er kjørt i isolert PGlite med roller, RLS og reelle SQL-operasjoner: privat SELECT/RPC og offentlig UPDATE avvises for vanlig bruker; annen bruker ser ikke casen; atomisk lagring og rollback ved feil i andre innsetting er testet; sletting kaskaderer; eldre ID-er/spørsmål bevares.
- Nettleser: ny langcase åpner «Hele casen», siste del/spørsmål kan velges direkte, kortcase viser løsning med tom besvarelse før fullføring, markeringen overlever reload, endret svar utløser ny tilbakemelding, eldre v2-case har alle deler åpne uten nye AI-knapper.
- Mobil: laboratoriesvar og referanseinformasjon kontrollert ved 390 px, også 200 % tekst. En avkuttet bakgrunnsoverskrift ble rettet. Diktering er kontrollert med testens simulerte transkripsjon; dette er ikke en test av faktisk mikrofon eller ElevenLabs.
- Automatisk testsett omfatter også blodgassregning, blandingsforstyrrelser, originalens inkonsistente tabellrad, nested privatfelt-filtrering, ordrette sitater, tomme svar, temporalScope, lagrings-/eierfeil, modellreparasjon og avbrutte datastrømmer.

## Klinisk kalibrering

Første sett omfatter åtte kortcaser og tre langcaser med ulike resonneringsprofiler. Kalibreringsverktøyet kjører den faktiske genererings-/kontrollkjeden og kan prøve gode, delvise, forsvarlige alternative og uforsvarlige besvarelser. Modellskrevne prøvesvar er ikke ekspertfasit.

Den lokale OpenAI-tilkoblingen kan brukes med samme modell som produksjonskonfigurasjonen. Det tester promptene, kontraktene og orkestreringen; det beviser ikke produksjonens Lovable-gateway, innlogging eller Supabase-lagring. Private testcaser og vurderingsgrunnlag skal ikke sjekkes inn i Git eller blandes med studentbiblioteket.

De endelige **åtte kortcasene og tre langcasene** har passert den faktiske v3-kjeden via direkte OpenAI med `gpt-6-astra`. Én kortcase og én langcase er også prøvd med modellbesvarelse og alle fire svarprofiler. Dette er modellbasert innholdskontroll, ikke klinisk ekspertgodkjenning eller en produksjonstest.

Testene avdekket for få tillatte blodgasser og tekstgrenser som kunne kutte rolletekst og tekstlige prøvesvar. Kontrakten er rettet, og berørte caser kjørt på nytt. Et for svakt avgrenset kildegrunnlag for nyreskade/legemidler ble styrket før den endelige geriatriske casen. Forkastede forslag er bevart; de ble ikke lagret som brukercaser. Reparasjon får både feilbeskrivelsen og det avviste utkastet, og må passere hele kontrollkjeden på nytt.

Se [kalibreringsrapporten](case-calibration.md) for forsøksantall, svarprofilutfall og begrensninger. Ingen gammel v2-modelltest regnes som bestått v3-kalibrering.

## Drift

Migreringen `supabase/migrations/20261028010000_private_case_assessments.sql` må kjøres i måldatabasen før denne appversjonen aktiveres. Den flytter eksisterende skjult grunnlag til privat tabell og fjerner offentlig skriverett for vanlige brukere. Deploy av app og database må derfor koordineres; den eldre skriveruten kan ikke brukes etter migreringen.

Serveren trenger eksisterende `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` og `LOVABLE_API_KEY`. Hemmelige nøkler skal aldri ha `VITE_`-prefiks. Den nye private lagringen trenger ingen `CASE_ASSESSMENT_KEY`; eldre krypterte data arkiveres uten å bli gjenbrukt som ny fasit. Diktering bruker fortsatt eksisterende `ELEVENLABS_API_KEY`.

Ingen produksjonsdatabase er endret i denne lokale testkjøringen. Faktisk Lovable/Supabase ende-til-ende-test krever prosjekttilgang og en innlogget testbruker. Verken denne tilkoblingen eller produksjonens servernøkler er tilgjengelige lokalt. Tilgjengelig OpenAI-nøkkel erstatter ikke dem.

Lange modellkall kan ta flere minutter; faktisk hostinggrense må prøves. Ingen vedvarende jobbkø/gjenopptaking eller distribuert kostnadskvote er lagt til. Kladd og markering lagres i samme nettleser, ikke på tvers av enheter. Tilbakemelding og modellbesvarelse genereres ved forespørsel og er ikke en permanent sensurhistorikk.

Endringen leveres på `codex/case-quality` i eksisterende utkast-PR. Push oppdaterer kodegjennomgangen; det er ikke bekreftet publisering av nettstedet.
