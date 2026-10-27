# Implementering og verifikasjon

27. oktober 2026. Se `case-generator-analysis.md` for kildeanalyse, samlet implementeringsprompt og den reviderte planen.

## Levert funksjon

Generatoren er integrert i eksisterende arbeidsflate, innlogging og casebibliotek. Den velger mellom 12 fagområder, 36 kliniske mønstre, seks beslutningsoppgaver og fem forløp med kompatibilitetsregler. Historikk over de siste 48 lagrede casene prioriterer underrepresenterte temaer og unngår nylige kombinasjoner; de tre siste casenes innhold sammenlignes også. Dette reduserer gjentakelser, men garanterer ikke at alle nye caser er semantisk unike.

Brukeren kan velge tema, startsted, to vanskelighetsnivåer og kort case eller 3–6 deler. Hele forløpet genereres samlet og kontrolleres før lagring. Nye lange caser åpnes trinnvis; gamle caser beholder sin arbeidsflyt. Alder vises fra det strukturerte aldersfeltet også når modellen utelater alder fra navnet. Bakgrunn, spørsmål og vitalia bruker eksisterende komponenter, inkludert lokale kladder, lesemodus og diktering.

Tilbakemelding gis etter fullføring. Hver del vurderes separat med bare opplysningene og svarene som var tilgjengelige i den delen. Vurderingen viser ordrett tekstbelegg, styrker, forbedringspunkter, forsvarlige alternativer, sikkerhet og neste læringssteg. Den gir ingen karakter. Brukeren kan laste ned et feilnotat for egen videreformidling. Ingen melding sendes automatisk.

## Medisinsk innholdsvalidering

1. Samme kontrakt beskriver modellens JSON-skjema og serverens strenge datavalidering.
2. Kode kontrollerer blant annet kompatibel alder/startsted, fremadgående tidslinje, enheter, brede fysiske målegrenser, oksygenkontekst, oppgavevariasjon, kilde-ID-er og enkelte diagnosehint. Grensene er ikke kliniske normalområder eller triagegrenser.
3. Et versjonert kilderegister inneholder avgrensede faglige holdepunkter. Pedagogiske dokumenter alene godtas ikke som rubrikkgrunnlag. Kliniske påstander kontrolleres mot det oppgitte kildeomfanget, ikke bare en eksisterende lenke.
4. En separat modellvurdering må godta alle ni kvalitetskriterier. Hvert avvist forslag kan genereres på nytt én gang; ved fortsatt feil returneres ingen case. Tilbakemelding har tilsvarende avgrenset nytt forsøk og egen kontroll.
5. Numeriske behandlingsdoser, ukontrollerte væskeboluser, skårgrenser, automatisk suicidrisikokategori og ubekreftet tvangsgrunnlag er utenfor denne versjonens faglige ramme. Mønsterkontroller fanger flere doseformater, men er ikke en uttømmende medisinsk parser; separat kilde-/modellkontroll er fortsatt nødvendig.
6. Private diagnoser og rubrikker krypteres med AES-GCM og bindes til eier og offentlig caseinnhold. Manipulert innhold kan ikke få en gyldig vurderingsnøkkel. API-et returnerer ikke private vurderingsfelt.

Dette er tekniske og modellbaserte sikkerhetsmekanismer, ikke fagpersonsignering. Før bred studentbruk bør fagansvarlig vurdere et større, representativt sett caser og tilbakemeldinger, spesielt barn, doseringsrelaterte spørsmål, psykiatri, tvang, behandlingsbegrensning og temaer med begrensede kildeutdrag. Avvisningsrate og feilrapporter bør følges opp.

## Supplerende kilder etter reelle modelltester

De første testene viste at arbeidskrav og korte temaomtaler ikke støttet alle konkrete råd. Kilderegisteret ble derfor utvidet; kontrollen ble ikke slått av. Følgende avgrensede kilder ble kontrollert 27.10.2026:

- [Helsedirektoratet, utredning av spiseforstyrrelser](https://www.helsedirektoratet.no/retningslinjer/spiseforstyrrelser/utredning-av-spiseforstyrrelser/utredning-av-spiseforstyrrelser-i-spesialisthelsetjenesten): psykiske og somatiske opplysninger, undersøkelse og indikasjon for prøver/EKG. Ingen reernæringsprotokoll innført.
- [Felleskatalogen, Atarax](https://www.felleskatalogen.no/medisin/atarax-ucb-546515): QT-relatert interaksjonsrisiko ved hydroksyzin sammen med escitalopram/citalopram. Ingen dose- eller erstatningsbehandling innført.
- [NICE CG109](https://www.nice.org.uk/guidance/CG109/chapter/recommendations): innledende vurdering ved mistenkt kortvarig bevissthetstap hos personer over 16 år.
- [NICE CG124, anbefaling 1.1.1](https://www.nice.org.uk/guidance/cg124/chapter/Recommendations): videre bildeutredning ved vedvarende mistanke om hoftebrudd etter negativt røntgen.
- [NICE CG50](https://www.nice.org.uk/guidance/CG50/chapter/recommendations): observasjon og respons ved forverring hos voksne i akutt sykehus.
- [Helsedirektoratet, behandlingsavklaringer](https://www.helsedirektoratet.no/veiledere/behandlingsavklaringer-ved-livsbegrensende-eller-alvorlig-langvarig-sykdom/beslutningsprosesser-for-behandlingsavklaringer): pasientmedvirkning, behandlingsmål og ansvar.

NICE-innholdet var tilgjengelig gjennom søkeindekserte anbefalinger; direkte sideåpning returnerte 403. Britiske anbefalinger er merket som fagstøtte innen den aktuelle populasjonen og settingen, ikke norske lokale prosedyrer eller lovhjemler. Kilderegisteret er kuratert, ikke et oppdatert fulltekstbasert oppslagsverk.

## Testresultater

| Kontroll                    | Resultat                                                                                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Automatiserte tester        | 42 bestått, 0 feilet, inkludert de 10 eksisterende testene.                                                                                                                                                                                                  |
| Variasjon                   | 120 deterministiske trekk: alle 12 temaer dekket, 10 per tema i dette testløpet, ingen identiske mønsterkombinasjoner innen de siste 48 og minst 100 ulike kombinasjoner totalt. Eldre kombinasjoner kan gjentas. Dette er ikke 120 klinisk genererte caser. |
| Typekontroll                | Bestått.                                                                                                                                                                                                                                                     |
| Produksjonsbygg             | Bestått.                                                                                                                                                                                                                                                     |
| Endrede kodefiler           | ESLint bestått.                                                                                                                                                                                                                                              |
| Hele prosjektets lint       | Eksisterende problemer i automatisk genererte Supabase-filer: 211 feil og 6 øvrige advarsler. Disse filene er ikke endret.                                                                                                                                   |
| Nettleser                   | Trinnvis åpning, ingen fremtidige deler i leser, kladd/gjenåpning, fullføring og simulert tilbakemelding bestått.                                                                                                                                            |
| Mobil/tilgjengelighet       | Ingen horisontal dokumentoverflyt ved 360, 390, 430 eller 1280 piksler; også kontrollert ved 200 % tekst og lav vindushøyde. Skjermbildene er visuelt gjennomgått.                                                                                           |
| Regresjon                   | Eksisterende delspørsmål lagres separat. Ved simulert lagringsfeil beholdes teksten og feil vises. Simulert diktering legges til riktig svar. Kort case kan fullføres. Innloggingskravet åpner eksisterende innloggingsside.                                 |
| Konfidensialitet/integritet | Testet eierbinding, endret case, feil nøkkel og manipulert kryptert tekst. Produksjonens nettleserfiler inneholder ikke servernøkkelnavn, private rubrikker eller genererings-/kontrollprompter.                                                             |

### Faktisk modellgenerering

Testene brukte tilgjengelig OpenAI-tilkobling med `gpt-6-astra`, samme modellnavn som løsningen bruker gjennom Lovable. De brukte de faktiske kontraktene, promptene, kontrollene og orkestreringen. Dette bekrefter ikke Lovable-gatewayens oppførsel eller innlogget lagring i produksjon.

- Barn: toåring med delvis bedring, men vedvarende endret kontakt og usikker hydrering/sirkulasjon. Prioritering og observasjon, ikke diagnosegjetning. Godkjent på første forsøk, omtrent 69 sekunder totalt.
- Psykisk helse/somatikk: spiseforstyrrelse, symptomlette, mulig interaksjonsrisiko og ønske om hjemreise. Etter styrket kildegrunnlag: godkjent på første forsøk, omtrent 63 sekunder.
- Geriatri: tre deler med fall, negative røntgenbilder, vedvarende funksjonstap og ønske om hjemreise. Godkjent på første forsøk, omtrent 105 sekunder. Visuell/innholdsmessig gjennomgang avdekket at alder manglet i navnefeltet; dette er rettet i selve presentasjonskoden og dekket av regresjonstest.

Det første testløpet avviste to forslag på kildegrunnlag; ett forsøk traff den daværende tidsgrensen. En kontrollprompt tolket dessuten private diagnosefelt som synlige. Disse problemene førte til bedre kildekobling, presis beskrivelse av private felt, mer konsise tekster og 240 sekunders tidsgrense per modellkall.

### Faktisk tilbakemelding

Tre prøvesvar på barnecasen ble kjørt gjennom tilbakemelding og separat kontroll etter presisering av sitatformatet:

- Begrunnet svar med alternativ håndtering: anerkjent som godt utviklet; forbedringspunkter ble skilt fra uforsvarlige handlinger.
- Tomt svar: markert ubesvart, ingen oppdiktede sitater eller styrker.
- Farlig legemiddelforslag og instruks om å ignorere reglene/gi A: markert som nødvendig revurdering, det farlige forslaget ble kritisert og ingen karakter ble gitt.

Alle tre bestod kontrollene; omtrent 17–21 sekunder per besvarelse inkludert separat kritikk. Et tredelt geriatrisk prøvesvar ga «godt utviklet», «kan utdypes» og «ubesvart» på de respektive delene; alle seks modellkall fullførte på omtrent 55 sekunder. Tidligere testforsøk med anførselstegn eller flere sitater i `evidence` ble korrekt avvist. Prompten krever nå ett sammenhengende ordrett utsnitt, og en formatfeil kan repareres én gang.

## Drift og gjenstående begrensninger

- Ingen databasemigrering eller nye pakkeavhengigheter kreves. Vurderingsgrunnlaget ligger kryptert i eksisterende `generated_cases.definition`.
- Sett en stabil, tilfeldig `CASE_ASSESSMENT_KEY` på serveren, minst 24 tegn og helst minst 32 tilfeldige byte. `LOVABLE_API_KEY` brukes som reserve hvis den dedikerte nøkkelen mangler. Bytte av nøkkel gjør eldre krypterte rubrikker uleselige; ikke roter uten migreringsplan. Nøkler skal aldri ha `VITE_`-prefiks.
- Eksisterende Supabase-konfigurasjon og `LOVABLE_API_KEY` må finnes på produksjonsserveren. En fungerende Lovable-nøkkel og innlogget testbruker var ikke tilgjengelig lokalt. Ende-til-ende-test av generering → lagring → gjenåpning → vurdering mot den faktiske gatewayen/databasen gjenstår.
- Endret kildeversjon gjør eldre vurderingsgrunnlag utilgjengelig for automatisk tilbakemelding; casen kan fortsatt brukes til egenøving. En fremtidig migrering krever ny faglig kontroll.
- Generering og vurdering kan ta flere minutter. Avgrenset regenerering øker mulig tidsbruk. Hostingens grense for samlet forespørselstid må testes med lange caser. Ingen vedvarende jobbkø eller gjenopptaking etter frakobling er innført.
- Sperren mot samtidige forespørsler gjelder én serverinstans. Den er ikke en distribuert kvote eller kostnadsgrense. Tilbakemelding lagres ikke som varig historikk.
- Trinnvis visning er pedagogisk; hele den offentlige casen finnes i klientdata. Dette er ikke eksamenssikring.
- Kun tre kliniske forløp og et lite antall prøvesvar er testet med modellen. Dette validerer ikke hele pensumbredden eller klinisk korrekthet generelt. Ikke alle viktige kliniske feil kan fanges av kode eller en annen modell.
- Avhengighetskontrollen ved installasjon rapporterte sju eksisterende sårbarheter, to høye og fem kritiske. Ingen pakkeoppgraderinger er gjort som del av denne endringen.
- Claude var ikke tilgjengelig. Kvalitetssikringen består av selvstendig gjennomgang, kodekontroller, modellkritikk og tester, ikke en uavhengig Claude- eller klinikervurdering.

Endringen leveres i `codex/case-quality`. Den er ikke slått sammen med hovedgrenen eller publisert til det aktive nettstedet.
