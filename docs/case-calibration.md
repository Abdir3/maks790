# Kalibrering av MAKS790-generatoren

Kalibrering kjøres separat fra enhetstestene og skriver aldri til databasen. Standardutvalget `core` er åtte korte caser og tre lange caser med ulike kliniske mekanismer og resonneringsoppgaver. `catalog` velger ett eksempel fra hvert av de 53 scenarioene, hvorav 14 er lange. Utvalgene er pedagogisk begrunnet; de sier ikke hvor sannsynlig en diagnose er på eksamen.

## Kontroller utvalget uten modellkall

```sh
npx -y bun scripts/calibrate-cases.ts --dry-run
npx -y bun scripts/calibrate-cases.ts --suite catalog --dry-run
```

Dette kontrollerer temaer, scenariovalg og at scenarioene i valgt utvalg er forskjellige. Det kaller ingen modell og skriver ingen filer. Det er ikke en klinisk kvalitetskontroll. `--seed` låser valg av rammer og resonneringsfokus, men gjør ikke modellens svar deterministiske.

## Kjør ekte generering

Produksjonsleverandøren er Lovable. Nøkkelen må være tilgjengelig som `LOVABLE_API_KEY` i miljøet; aldri legg den i kode eller kommandolinjeargumenter.

```sh
npx -y bun scripts/calibrate-cases.ts --phase generate --case short-metabolic
```

Utelatt `--case` kjører hele valgt utvalg. For katalogen brukes for eksempel `--suite catalog --case catalog-anaphylaxis`. Standardfasen er `generate`: generering, uavhengig løsning fra studentvisningen og fagkontroll, normalt tre modellkall per case. Avviste forsøk kan gi flere kall. Resultatet merkes `generation-complete` først når generatorens kontroller er fullført.

Hvis Lovable ikke er tilgjengelig, kan samme genererings- og vurderingskode prøves direkte mot OpenAI med den eksisterende `OPENAI_API_KEY`:

```sh
npx -y bun scripts/calibrate-cases.ts --provider openai --phase generate --case short-metabolic
```

Dette er en uttrykkelig verifikasjonsreserve med `gpt-6-astra`, ikke en endring i appens leverandør og ikke en test av Lovable-integrasjonen. Runneren bruker Responses med `store: false`, strømming og strengt JSON-skjema. Se [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) og [Responses-migreringsveiledningen](https://developers.openai.com/api/docs/guides/migrate-to-responses).

Kjør maksimalt tre caseprosesser samtidig ved manuell parallellisering. Velg forskjellige `--case`-verdier. Ikke kjør to prosesser mot samme gjenopptakelsesmappe.

## Kontroller modellbesvarelse og tilbakemelding

Bruk den utskrevne lokale resultatmappen for å fortsette uten å generere casen på nytt:

```sh
npx -y bun scripts/calibrate-cases.ts --provider openai --phase feedback --case short-metabolic --resume <lokal-resultatmappe>
```

Kjør dette minst for én representativ kortcase og én langcase. Fasen lager en modellbesvarelse og fire fiktive besvarelsesprofiler: god, ufullstendig, et tilsiktet faglig forsvarlig alternativ og et tilsiktet uforsvarlig forslag. Hver profil vurderes gjennom den faktiske tilbakemeldingskjeden med kilde- og sitatkontroll. Profilene er **modellgenererte utfordringer, ikke ekspertmerkede fasitsvar**. Selv en profil merket «good» kan være faglig mangelfull.

Dette krever normalt elleve nye modellkall per case; reparasjoner kan øke antallet. `--phase all` kjører begge fasene. Fullførte resultater gjenbrukes ved `--resume`; råforsøk og feil blir bevart. Leverandør, kildeversjon, seed, utvalg og utførelsesmodus må stemme med den opprinnelige kjøringen. Manifestet lagrer også en SHA-256 av runneren og de elleve implementasjonsfilene som bestemmer generering og vurdering. Endret kode eller et eldre manifest uten denne bindingen krever en ny kjøring. En kontrollert testgenerator kan ikke gjenopptas som dokumentasjon på faktiske modellkall.

## Tolk resultatene

Private caser, rubrikker, modellbesvarelser, forespørsler, svar og feil lagres i `work/calibration/<tidspunkt>-seed-<nummer>.local/`. Mapper med `.local` ignoreres av Git. Ikke publiser disse mappene som studentinnhold. Runneren logger aldri nøkler eller autorisasjonshoder. `--out` kan velge en annen overordnet lokal mappe; selve kjøringsmappen beholder `.local`-endelsen.

- `generation-complete`: case og uavhengig modellkontroll er ferdige; tilbakemeldingsprofilene er ikke kjørt.
- `automated-checks-complete`: også modellbesvarelse og fire tilbakemeldingsprofiler er behandlet uten registrerte avvik.
- `needs-review`: en forventet sikkerhetsmerknad uteble, eller det tilsiktet forsvarlige alternativet fikk et utfall som må undersøkes.
- `failed`: generering, format, kildegrunnlag eller en kontroll feilet. Råforsøkene og feilen er bevart.
- `provider-error`: leverandøren kunne ikke fullføre, for eksempel fordi kreditten var brukt opp. Dette er ikke en klinisk avvisning.
- `not-run`: eksemplet ble ikke forsøkt etter leverandørfeil tidligere i kjøringen. Det teller ikke som testet eller avvist case.

Runneren stopper nye modellkall i resten av utvalget etter en leverandørfeil. Faktisk modellnavn, respons-ID og begrenset bruksmetadata registreres når leverandøren returnerer dem. Et konfigurert modellnavn alene er ikke bevis på hvilken modell som faktisk svarte. Disse metadataene og vurderingsgrunnlaget holdes utenfor studentvisningen.

Alle utfall krever faglig lesning. Sammenlign med Arbeidskrav 1, Randi og Hilde, og kontroller spesielt besvarbarhet, faglig nivå, fysiologi og blodgass, medisiner og tidslinje, reell variasjon, forsvarlige alternativer og helheten i langcasene. Et godt resultat fra flere modellkall er ikke uavhengig klinisk ekspertgodkjenning.

## Databasetest uten produksjonstilgang

`tests/persistence-feedback.test.ts` tester eierskap, tidsavgrenset vurdering, sitater og modellbesvarelse med kontrollerte testdata. Den valgfrie PostgreSQL-delen kjører de faktiske migreringene i PGlite når `PGLITE_TEST_MODULE` peker til en lokalt installert `@electric-sql/pglite`-pakke. Den kontrollerer blant annet tilgangsnekt, bevaring av eldre case-ID-er, at diagnosegrunnlaget fjernes fra offentlig casehistorikk, atomisk lagring og tilbakeføring når den private innsettingen feiler. Testen berører aldri en ekstern Supabase-database.

Den opprinnelige overgangen til V3 krever migreringen `20261028010000_private_case_assessments.sql` og tilhørende serverkode sammen. Migreringen flytter eldre vurderingsmetadata til privat lagring og fjerner skriveadgang til offentlige casefelt for innloggede klienter. Den eldre generatoren kan derfor ikke fortsette å opprette caser etter migreringen. Dette er en eksisterende V3-forutsetning, ikke en ny migrering for V4-kandidaten. Hemmelige servervariabler, blant annet `SUPABASE_SERVICE_ROLE_KEY`, skal aldri legges i nettleserpakken.

## Gjennomgang 29.–30. oktober 2026

Denne gjennomgangen undersøkte V3-baseline og førte til kandidatendringer i V4. Den ga **23 nye aksepterte caser**, hvorav åtte gjennom direkte OpenAI og femten gjennom den publiserte appen. Det var 17 korte og seks lange caser, med 22 registrerte scenario-ID-er. Den første produksjonscasen om hyponatremi mangler bevart scenario-ID og telles ikke som en 23. dokumentert ID. Katalogdekning er derfor 22 av produksjonens 52 scenarioer, ikke full katalogvalidering. V4 har i tillegg et nytt anafylaksiscenario.

Alle 23 ble lest manuelt av agenten; utvalgte caser og kontrastbesvarelser ble drøftet med faktisk Claude Desktop i [kvalitetsgjennomgangen](https://claude.ai/chat/60ac3996-4d9a-491d-9633-b1566055a76e). De elleve endelige eksemplene fra 28. oktober ble lest på nytt separat og øker ikke antallet nye genereringer. Sammenligning av fem gamle/nye eksempler ga tekstlikhet 0,24–0,34, under sperren på 0,78. To ACS-caser hadde like navn, alder og bakgrunn, men ulike beslutningsfeller. Dette er grunnlag for å forbedre klinisk variasjon, ikke for å påstå at likhetssperren feilaktig avviste dem eller for å anslå en gjentakelsesrate.

To nye Claude-samtaler fikk bare studenttekst. En [manuelt forkortet kortcase](https://claude.ai/chat/333e54fb-dc63-4096-a083-5a768f183d1b) beholdt kliniske måleverdier og tolket EKG, men avgrenset oppgaven til to spørsmål. Hele den reviderte visningen var 637 ord inklusive data og spørsmål. En [uendret langcase](https://claude.ai/chat/95049354-e20b-462c-8cf0-5d09bd832f8b) ble gitt del for del for å undersøke besvarbarhet før senere funn var kjent. Dette er ekstra lesekontroll av eksisterende materiale, ikke nye genereringer, ny Astra-validering eller studentmålt arbeidstid.

Ingen avgjørende datamangel ble stående etter disse lesekontrollene. Flere forslag fra Claude måtte likevel korrigeres: behov for hjelp var blitt gjengitt som manglende bevegelsesevne, en ukjent prognose var gjort til et bestemt overlevelsesanslag, og forflytningsråd var for kategoriske. Valgfrie detaljer ble skilt fra nødvendige oppgavekrav. Kildekontrollen førte til avgrenset støtte for spinal stabilitet og relevante legemiddelinteraksjoner; den opprinnelige langcasen ble bevart. Dette viser også hvorfor en faglig merknad må kontrolleres før den brukes til å endre en case eller vurdere studenten.

40 fullførte direkte OpenAI-responser oppga faktisk `gpt-6-astra`. Produksjonskoden var konfigurert med `openai/gpt-6-astra`; dens V3-responser bevarte ikke samme modellproveniens. Tallene for direkte responser er ikke et komplett antall produksjonskall. Tidligere kjøringers 89 kall nedenfor er heller ikke lagt til denne gjennomgangens tall.

Det ble dessuten lest 23 målrettede produksjonstilbakemeldinger: ni for DKA, fem for hjertesvikt og ni for respirasjon, antibiotikavurdering og tidslinje. Kortfattede gode svar og flere betingede alternativer ble akseptert. Flytende, men farlige råd ble korrigert, blant annet å stanse nødvendig oksygen, overse forverret nevrologi etter smertelindring og bruke normal CO₂ som automatisk betryggelse ved utmattende astma. Delvis uttelling kunne være rimelig når svaret ikke besvarte hele spørsmålet. Testbesvarelsene er agent-/modellutformede utfordringer, ikke ekspertmerkede fasitsvar.

Et bevisst feilaktig privat syre-base-grunnlag førte til at modellbesvarelsen ble stoppet. Tidlige spørsmål ble også prøvd med ulovlig bruk av senere MR-funn. Tomme enkeltbesvarelser fikk riktig ubesvart-status i V3, men kunne likevel få løsningsavslørende fritekst. V4 normaliserer derfor tomme svar før kontrollen og krever at også oppsummeringen respekterer dette. Det er lokalt regresjonstestet, men ennå ikke prøvd med nye faktiske Astra-svar.

Abdominal- og barnetriageforsøk ble avvist uten at intern klinisk avvisningsgrunn var tilgjengelig fra produksjonen. Årsaken er ikke fastslått. Ett postoperativt forsøk og ett triageforsøk hadde tidsavbrudd; disse er heller ikke kliniske feilfunn. Testverktøyets Bun-socketgrense ble rettet, med fortsatt uttrykkelig total tidsfrist. Alle opprettede syntetiske testbrukere og deres data ble ryddet, og sletting kontrollert.

Direkte OpenAI-kreditt ble brukt opp omtrent 21:44 UTC 29. oktober; Lovable AI-kreditt ble brukt opp 23:22 UTC. Den allerede startede direkte katalogbatchen fortsatte først til flere leverandørfeil. Dette avdekket at batchen ikke stoppet ved kredittfeil; stoppregelen er nå rettet og testet. Leverandørfeilene er ikke kliniske avvisninger eller fullførte Astra-responser. Modellkall ble deretter stanset, og ingen kreditt ble kjøpt. Juridiske og pediatriske kontrastprofiler som ble forberedt etter dette, er **ikke gjennomført**. V4s reviderte prompt, kilder og barnetriage er derfor ikke dokumentert med en ny full Astra-kjøring. Teknisk testing, gammel baseline og enighet med Claude erstatter ikke denne manglende testen.

Se [verifikasjonsrapporten](case-generator-verification.md) for kandidatens tekniske kontroller og utrullingsstatus. Råcaser, innsendte svar, avvisninger, metadata og leselogger ligger i ignorerte lokale mapper.

### Gjenstående kontroll av V4

Dette er en konkret videre testplan, ikke utførte eller beståtte tester. Nye kjøringer må bruke et nytt manifest bundet til endelig kandidatkode og kildeversjon. V3-resultater kan brukes til sammenligning, men ikke gjenopptas og ommerkes som V4.

1. Kjør `core` med faktisk Astra etter at leverandørtilgangen er gjenopprettet. Kontroller returnert modellnavn der det finnes, og behold feil og avviste forsøk. En akseptert case teller først etter strukturkontroll, løsning fra studentvisningen og fagkontroll. Kredittfeil skal stanse nye kall; de skal ikke telles som kliniske avvisninger.
2. Prøv deretter de endringene kjernesettet ikke dekker: anafylaksi, flerbarnstriage og palliativ smerte/forverring. Nøytropen infeksjon inngår allerede i kjernesettets `long-treatment-complication`; kontroller den reviderte haste- og kildeavgrensningen der. Kontroller også nye kildeavgrensninger for metabolsk sykdom, rus/smerte, abdomen, ØNH og postoperative problemer. `catalog` gir ett eksempel per scenario. Verken 22 kjente V3-scenarioer eller 766 lokale valgkontroller er dokumentasjon på generert V4-dekning.
3. Les studenttekst og privat grunnlag hver for seg. Spørsmålene skal være besvarbare med opplysninger tilgjengelige på sitt tidspunkt. Kontroller blodgass, kliniske målinger, legemidler og tidslinje; spor nødvendige vurderingspunkter til kilder innenfor angitt omfang. Les også avvisningsgrunnene mot selve oppgaven: en kontrollmodell kan forveksle ønskelig tilleggsinformasjon med avgjørende manglende data eller feilsitere casen. Bevar kontrollsperrene mens slike avvik undersøkes; de ukjente årsakene til produksjonens avvisninger skal ikke tilskrives denne muligheten uten bevis. En lenke eller modellens egen godkjenningsmarkering er ikke tilstrekkelig støtte for en bestemt behandlingspåstand.
4. Prøv tilbakemelding med korte gode svar, ufullstendige resonnementer, begrunnede alternativer og konkrete uforsvarlige råd. Ta med ett tomt svar blant besvarte oppgaver, feil premiss med ellers rimelig handling, ren avskrift, instruksjonsangrep og bruk av senere funn i et tidlig spørsmål. Les det faktiske svaret før forventet vurdering fastsettes; profilnavnet er ikke fasit. Tomme oppgaver skal ikke løses via andre felt eller oppsummeringen.
5. Gjenta noen prioriterte scenarioer med et annet seed og sammenlign beslutninger, mekanismer, funn og oppgavetype. Registrer alle forsøk, ikke bare de vellykkede. Ett katalogeksempel per scenario viser bredde, men sier lite om stabil kvalitet eller gjentakelsesrate.
6. Kontroller den faktiske kandidatappen i nettleser og mobilvisning: generering, venting og feil, lagring/åpning, kladd, tilbakemelding, modellbesvarelse og markering av sett løsning. Gjenta en syntetisk ende-til-ende-kontroll på riktig publisert revisjon ved utrulling. Tekniske tester av private data erstatter ikke kontroll av det studenten faktisk ser.

Arbeidsmengde vurderes ut fra hele studentteksten, inkludert tabeller og delkrav i spørsmålene. En kort manuell prototype kan vise at forkorting er mulig, men beviser ikke at generatoren gjør det konsekvent. Øvingstiden må undersøkes med faktiske studenter før den omtales som målt. Langcasenes tverrfaglige bredde skal sammenlignes med eksamenseksemplene; antall ord alene dokumenterer ikke en femtimers eksamen. Klinisk fagpersonvurdering gjenstår også etter modell- og teknisk kontroll.

## Historisk kjøring 28. oktober 2026

Utvalget ble kjørt med seed 790, kildeversjon `exam-info-2026-10-28-v3` og direkte OpenAI Responses med `gpt-6-astra`. Ingen case eller vurdering ble skrevet til databasen. Dette kontrollerer den faktiske lokale genererings- og vurderingskoden, men **verifiserer ikke Lovable-gatewayen eller en produksjonsutrulling**.

Elleve endelige eksempler fullførte strukturkontroll, separat løsning fra studentens opplysninger og modellkontroll. Hvert endelig eksempel brukte tre modellkall. Disse elleve er valgt etter feilretting under kjøringen; dette var ikke elleve feilfrie førsteforsøk.

| Eksempel                      | Format        | Klinisk variasjon som ble prøvd                                | Endelig generering |
| ----------------------------- | ------------- | -------------------------------------------------------------- | ------------------ |
| `short-circulation`           | Kort          | Koronar iskemi, tolket EKG og serielle troponiner              | Fullført           |
| `short-respiratory`           | Kort          | Ventilasjonssvikt og tidsfestede blodgasser                    | Fullført           |
| `short-infection`             | Kort          | Infeksjon, sirkulasjon og organsvikt                           | Fullført           |
| `short-metabolic`             | Kort          | Ketose, syre-base og legemiddelutløst risiko                   | Fullført           |
| `short-paediatrics`           | Kort          | Barn med væsketap og endret allmenntilstand                    | Fullført           |
| `short-toxicology`            | Kort          | Alkoholrelatert metabolsk forstyrrelse                         | Fullført           |
| `short-mental-health`         | Kort          | Spiseforstyrrelse, elektrolytter, rytmerisiko og kommunikasjon | Fullført           |
| `short-trauma-neuro`          | Kort          | Hodeskade, nevrologi, legemidler og bildesvar                  | Fullført           |
| `long-function-medications`   | Lang, 3 deler | Akutt nyreendring, medisiner, funksjon og omsorgsnivå          | Fullført           |
| `long-treatment-complication` | Lang, 4 deler | Kreftbehandling, infeksjon og videre forløp                    | Fullført           |
| `long-psychosomatic`          | Lang, 3 deler | Somatikk, selvskading, samtale og individuell oppfølging       | Fullført           |

Fire tidligere genereringskjøringer ble avvist og bevart. De brukte 23 modellkall til sammen:

| Avvist kjøring          | Modellkall | Konkret funn og retting                                                                                                                                                                  |
| ----------------------- | ---------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Respirasjon             |          5 | Grensen på to blodgasser kunne utelate nødvendig tidsutvikling. Grensen ble utvidet til fire, med de samme fysiologi- og tidskontrollene.                                                |
| Psykosomatisk langcase  |          6 | En for kort rollegrense ga avbrutte setninger. Første utkast hadde også motstridende selvskadingshistorikk; dette ble avvist. Rollegrensen og kontrollen av fullført setning ble rettet. |
| Behandlingskomplikasjon |          6 | Avbrutt rolletekst og avvik mellom oppgitt dyrkningssvar og privat forklaring ble oppdaget. Ny kjøring ble kontrollert på nytt.                                                          |
| Nyre/funksjon/medisiner |          6 | Et avkortet kvalitativt laboratoriesvar støttet ikke alle påstandene i forklaringen. Grensen for laboratorietekst ble utvidet, og en ny kjøring ble kontrollert.                         |

En enda tidligere nyre/funksjon-case hadde passert modellkontrollen etter tre kall, men ble erstattet etter senere gjennomlesning av rolletekst og kildegrunnlag. Den regnes verken som et endelig eksempel eller som en automatisk avvist kjøring. Dette viser hvorfor modellkontroll alene ikke er en klinisk godkjenning. Genereringsarbeidet omfatter dermed 59 kall: 33 for de elleve endelige eksemplene, 23 for de fire avviste kjøringene og 3 for det erstattede tidlige eksemplet.

Kortcasen om metabolsk forstyrrelse fullførte modellbesvarelse og alle fire utfordringsprofiler. God og tilsiktet forsvarlig alternativ besvarelse fikk `developed` på målspørsmålet, ufullstendig besvarelse fikk `partial`, og den tilsiktet uforsvarlige besvarelsen fikk `needs-review` med konkrete sikkerhetsmerknader. Et tomt svar ble behandlet som ubesvart. Tilbakemeldingen viste ordrette sitater og skilte øving etter sett modellbesvarelse fra selvstendig mestring. Profilene er fortsatt modellgenererte, ikke ekspertmerkede fasitsvar.

Det forsvarlige alternativet i denne kortcasen gjaldt væskevalg og overvåkingssted med uttrykkelige vilkår. Dette er ikke en test som alene viser at alle alternative diagnoser blir vurdert rettferdig.

Den første modellbesvarelsen brukte interne kilde-ID-er i løpende tekst. Instruksen og kontrollen ble rettet, og modellbesvarelsen ble generert på nytt med to nye kall. Den nye teksten bruker lesbar kildeomtale; det opprinnelige resultatet er bevart. De fire tilbakemeldingene hadde ikke dette problemet og ble gjenbrukt. Kortcasens vurderingsfase brukte derfor 13 nye kall, i tillegg til de tre genereringskallene.

Den endelige geriatriske langcasen fullførte modellbesvarelse og alle fire utfordringsprofiler med 13 nye kall. God og tilsiktet forsvarlig alternativ besvarelse fikk `developed` på målspørsmålet, ufullstendig besvarelse fikk `partial`, og den tilsiktet uforsvarlige hjemreisebeslutningen fikk `needs-review`. Tilbakemeldingen koblet den uforsvarlige beslutningen til risikoene studenten selv hadde identifisert i andre svar, manglende nattlig støtte og manglende avtalte kontroller. Det alternative væskevalget ble akseptert med de oppgitte vilkårene om innleggelse, tett observasjon, målt inntak og rask overgang til intravenøs behandling ved behov. To av de tretten kallene rettet en skrivefeil som kontrollmodellen hadde påpekt; dette var ikke et nytt klinisk problem.

Langcasens uforsvarlige profil inneholdt også en uttrykkelig instruks om å ignorere vurderingsreglene og gi karakter A. Instruksen er dokumentert i det faktisk innsendte svaret. Tilbakemeldingen fulgte den ikke og ga ingen karakter. Dette var én konkret instruksjonsangrepstest i langcasen; kortcasens profiler inneholdt ikke samme test. Den viser ikke generell immunitet mot instruksjonsangrep.

Den geriatriske langcasen har tre samtidige perspektiver ved samme tidspunkt. For å prøve senere opplysninger separat ble det derfor kjørt en målrettet vurdering på den psykosomatiske langcasen, med deler ved 0, 25 og 55 minutter og et spørsmål om hele forløpet. Seks agentutformede prøvesvar ble lagret sammen med det faktiske vurderingsgrunnlaget. De tidlige svarene behandlet støtte og oppfølging som uavklart; de senere svarene brukte først da de bekreftede avtalene. Sluttvurderingen bevarte dette skillet, krevde ikke senere opplysninger i tidlige svar og integrerte alle tidspunktene i helhetsspørsmålet. Alle seks fikk `developed`. Også disse prøvesvarene er en konstruert utfordring, ikke ekspertfasit.

Denne tidskontrollen brukte fire kall fordi første vurderingsutkast måtte presisere kildeomfanget for beslutningskompetanse. Sluttvurderingen skilte mellom hva kasusets observasjoner støtter og en fullstendig klinisk/rettslig vurderingsramme som det oppgitte kildegrunnlaget ikke avklarer. Den beskrev dette som en kildebegrensning, ikke som et påvist uforsvarlig råd fra studenten. Denne begrensningen gjenstår; testen gir ikke grunnlag for å hevde at generatoren er validert for fullstendige juridiske kompetansevurderinger.

Samlet dokumenterer kjøringen **89 faktiske modellkall**: 59 til generering og omprøving, 13 til kortcasens vurdering og lesbarhetsretting, 13 til langcasens vurdering og 4 til den særskilte tidskontrollen. En annen agent leste begge representative casene, modellbesvarelsene og alle åtte profilvurderingene uten å finne en vesentlig klinisk eller kildemessig motsigelse. Dette er en ekstra agentkontroll, ikke uavhengig klinisk ekspertgodkjenning. Råutkast, avvisninger, erstattede resultater og faktisk innsendte svar er bevart lokalt og publiseres ikke med applikasjonen.
