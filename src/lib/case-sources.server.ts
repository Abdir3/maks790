import type { SourceLink } from "./case-contract";
export const SOURCE_VERSION = "exam-info-2026-10-29-v4";
// v4 adds sources without changing the scope of existing source IDs. Saved v3
// cases therefore retain their assessment; unknown/older bases still fail closed.
export const COMPATIBLE_SOURCE_VERSIONS = ["exam-info-2026-10-28-v3", SOURCE_VERSION] as const;
const compendium = "https://drive.google.com/file/d/1g-Wdd3TfFR218yMBjqfwEP6tZVWMeDhk/view";
export const SOURCES: SourceLink[] = [
  {
    id: "calcium-interpretation-current",
    title: "Akershus universitetssykehus: Begrensninger ved albuminkorrigert kalsium",
    url: "https://www.ahus.no/nyheter/diagnostikk-og-teknologi/albumin-ny-analysemetode-samt-avvikling-av-analyse/",
    scope:
      "Publisert 03.10.2025; kontrollert 30.10.2026. Ahus avviklet albuminkorrigert kalsium fordi også en lokalt utviklet formel ga mange feilkorrigeringer. Albuminanalyser påvirkes av analysemetode, særlig ved lave verdier, nyresykdom og akuttfasereaksjon. Fritt kalsium anbefales når totalkalsium ikke kan forventes å gjenspeile den frie fraksjonen pålitelig. Et albuminkorrigert resultat er derfor ikke en universell fasit eller automatisk bedre enn totalkalsium. Tolk analysen og referanseintervallet som faktisk er oppgitt, sammen med klinikken. Kilden støtter analysevalg og kritisk tolkning, ikke en behandlingsgrense eller en bestemt korreksjonsformel.",
  },
  {
    id: "glimepiride-hypoglycemia-current",
    title: "Felleskatalogen: Glimepirid, hypoglykemi ved terapeutisk bruk",
    url: "https://www.felleskatalogen.no/medisin/glimepirid-teva-teva-632634",
    scope:
      "Forsiktighetsreglene kontrollert 30.10.2026. Hypoglykemi kan komme tilbake etter vellykket initial behandling. Uregelmessige eller manglende måltider, underernæring, alkohol, nedsatt nyrefunksjon, leverpåvirkning, dose og interaksjoner påvirker risikoen. Alvorlig eller vedvarende hypoglykemi som bare bedres forbigående, krever rask medisinsk behandling og kan kreve innleggelse. Vurder pasientens faktiske preparat, eksponering, glukoseforløp, matinntak og mulighet for trygg oppfølging; ett normalt glukosesvar etter behandling avgjør ikke alene videre omsorgsnivå. Utdraget gjelder glimepirid og gir ingen fast observasjonstid, erstatningsordinasjon eller dose-/antidotregime.",
  },
  {
    id: "sulfonylurea-poisoning-current",
    title: "Giftinformasjonen: Sulfonylureaforbindelser, risiko og forløp",
    url: "https://www.helsebiblioteket.no/forgiftninger/legemidler/sulfonylureaforbindelser-behandlingsanbefaling-ved-forgiftning",
    scope:
      "Revidert 2022; kontrollert 30.10.2026. Sulfonylurea stimulerer insulinfrigjøring. Ved forgiftning kan hypoglykemi komme sent, vare lenge og vende tilbake etter avsluttet behandling. Lite næring, akutt sykdom, nyre-/leversykdom, alder og samtidig legemiddelbruk påvirker risikoen; betablokkere kan gjøre varselsymptomene mindre tydelige. Følg glukose og klinisk tilstand og avklar videre behandling og observasjon med lege/Giftinformasjonen. Kilden beskriver også hypoglykemirisiko ved vanlige doser, men forgiftningsregimet skal ikke automatisk overføres til alle terapeutiske hendelser. Utdraget gir ingen toksisk dosegrense, fast observasjonstid eller glukose-/oktreotidregime.",
  },
  {
    id: "delirium-current",
    title: "NICE CG103: Delirium hos voksne i sykehus og institusjon",
    url: "https://www.nice.org.uk/guidance/cg103/chapter/Recommendations",
    scope:
      "Oppdatert 18.01.2023; anbefalingene 1.3–1.8 kontrollert i indeksert primærtekst 30.10.2026, direkte åpning ga 403. Vurder akutt eller svingende endring i oppmerksomhet, kognisjon, aktivitet og samhandling mot pasientens utgangspunkt; hypoaktivt delirium kan overses. Ved tegn til delirium brukes strukturert vurdering av kompetent personell; retningslinjen omtaler 4AT og egne verktøy i intensiv/postoperativ overvåkning. Et screeningsfunn erstatter ikke klinisk vurdering av årsakene. Flere utløsere kan foreligge samtidig. Revurder legemidler, smerte, infeksjon, hypoksi, væske, ernæring og søvn, og støtt orientering, sansing og kontakt med kjente personer. Ved uro eller fare prøves tilpasset deeskalering først. Kortvarig haloperidolbehandling kan vurderes individuelt når dette ikke er tilstrekkelig eller egnet; hjerte-/nevrologisk risiko, særlig Parkinson/Lewy-legeme-sykdom, må tas med. Britisk fagstøtte, ikke norsk tvangshjemmel. Utdraget gir ingen skårtabell, dosering eller krav om ett bestemt verktøy i enhver case.",
  },
  {
    id: "mononucleosis-current",
    title: "Norsk forening for infeksjonsmedisin: Epstein-Barr-virus-infeksjon",
    url: "https://metodebok.no/emne/aHqjpQRz/epstein-barr-virus-infeksjon/infeksjonsmedisin-%28nfim%29",
    scope:
      "Versjon 2.1, publisert 26.03.2026, faglig oppdatert 04.06.2025; diagnostikk og mononukleoseavsnitt lest i indeksert primærtekst 30.10.2026, direkte åpning ga 403. Sammenhold feber, tonsillitt, lymfeknuter, milt/lever, blodstatus og leverprøver. Heterofile antistoffer kan være negative tidlig og hos enkelte med primærinfeksjon, særlig barn; vurder relevant EBV-serologi og tidsforløp. EBV-PCR er normalt ikke indisert for vanlig primær mononukleose, fordi DNA også kan påvises ved reaktivering. Immunsuppresjon og annen alvorlig EBV-sykdom vurderes særskilt. Behandling er vanligvis symptomatisk; antivirale midler bedrer ikke det kliniske forløpet ved vanlig mononukleose. Luftveisobstruksjon eller alvorlig organpåvirkning krever medisinsk vurdering; steroider er ikke rutine i ukompliserte tilfeller. Bakteriell komplikasjon må begrunnes før antibiotika vurderes. Aktivitet tilpasses sykdom og miltrisiko. Utdraget gir ikke faste aktivitetsfrister, laboratoriets tolkningsalgoritme eller eksakte behandlingsdoser.",
  },
  {
    id: "mononucleosis-complications",
    title: "Norsk legemiddelhåndbok: Mononukleose, klinikk og komplikasjoner",
    url: "https://www.legemiddelhandboka.no/extended/infeksjonssykdommer/mononukleose",
    scope:
      "Revidert 28.11.2023; klinikk, komplikasjoner og overordnede behandlingsprinsipper lest 30.10.2026. Ungdom og yngre voksne kan få feber, svelgsmerter, lymfeknutesvulst, leverpåvirkning og miltforstørrelse. Vurder drikkeevne, hydrering og luftvei; uttalt svelgbesvær eller respirasjonsproblem kan kreve sykehus/ØNH-vurdering. Miltruptur er en alvorlig komplikasjon, og en ikke-palpabel milt utelukker ikke risiko. Amoksicillin/ampicillin kan utløse uttalt utslett ved mononukleose og skal ikke gis som behandling av selve virusinfeksjonen. Symptomlindring må tilpasses organfunksjon og kontraindikasjoner. Kilden brukes her ikke til PCR-indikasjon, automatisk valg mellom paracetamol og NSAID, eksakte doser eller en universell frist for retur til idrett.",
  },
  {
    id: "peritonsillar-adult-current",
    title: "Helsedirektoratet: Peritonsillær abscess hos voksne",
    url: "https://www.helsedirektoratet.no/retningslinjer/antibiotika-i-sykehus/infeksjoner-i-ore-nese-hals-tann-og-kjeve",
    scope:
      "Anbefaling oppdatert 18.02.2026; kontrollert 30.10.2026. Gjelder voksne med peritonsillær abscess i sykehuskontekst. ØNH-vurdering og drenasje/kirurgisk behandling er sentralt sammen med antibiotika. Innleggelse og intravenøs versus peroral behandling avgjøres etter klinisk vurdering; ikke alle trenger innleggelse. CT vurderes ved mistanke om dypere infeksjon, ikke automatisk ved enhver halsinfeksjon. Utdraget gir ikke antibiotikadose, behandlingsvarighet eller prosedyreoppskrift og skal ikke brukes som barneregime.",
  },
  {
    id: "peritonsillar-child-current",
    title: "Norsk barnelegeforening: Komplikasjoner til akutt tonsillitt",
    url: "https://www.helsebiblioteket.no/innhold/retningslinjer/pediatri/akuttveileder-i-pediatri/7.lunge-og-luftveissykdommer-inkludert-luftveisinfeksjoner/7.7-akutt-tonsillitt-og-skarlagensfeber",
    scope:
      "Akuttveileder i pediatri 7.7, faglig oppdatert 01.11.2022; komplikasjonsavsnitt lest 30.10.2026. Trismus, dysfagi, sikling og uvula som avviker fra affisert side støtter peritonsillær abscessmistanke; lokal hevelse kan komme før synlig abscess. Tilstanden behandles med antibiotika og incisjon etter medisinsk/ØNH-vurdering. Nakkesmerter, torticollis, stridor eller alvorlig allmennpåvirkning kan kreve vurdering av dypere halsinfeksjon. Ved ustabilitet med respirasjonsbesvær sikres luftveien før videre diagnostikk. Mistanke om komplikasjon kan kreve innleggelse. Utdraget støtter klinisk gjenkjenning og prioritering hos barn, ikke eksakte doser, prosedyrer eller et krav om CT hos alle.",
  },
  {
    id: "interpreter-current",
    title: "Helsedirektoratet: Bruk av tolketjenester i helse- og omsorgstjenesten",
    url: "https://www.helsedirektoratet.no/veiledere/tolketjenester-i-helse-og-omsorgstjenesten/bruk-av-tolketjenester-i-helse-og-omsorgstjenesten",
    scope:
      "Faglig endret 05.01.2026; kontrollert 30.10.2026. Vurder kommunikasjonen ut fra alvorlighet, kompleksitet og pasientens forutsetninger. Bruk kvalifisert tolk når nødvendig for forsvarlig hjelp; fremmøte eller fjerntolk vurderes konkret. Pårørende bør ikke erstatte kvalifisert tolk. Barn under 18 år skal ikke brukes som tolk, med snevre unntak blant annet ved nødvendig nødkommunikasjon uten annet alternativ; kompleks eller belastende informasjon skal ikke legges på barnet. Når hjelp ikke kan vente, vurder forsvarlig midlertidig kommunikasjon og dokumenter begrensningene. Forklar tolkens rolle og taushetsplikt, kontroller forståelsen og dokumenter behov og valgt løsning. Pasientens ønske om å avstå fra tolk må utforskes og vurderes konkret; det gir ikke automatisk adgang til tvang. Veilederen omtaler generell overgangsdispensasjon fra kvalifikasjonskravet ut 2026; forsvarlighetskravet gjelder fortsatt. Utdraget er ikke en generell tvangshjemmel eller diagnosespesifikk behandlingskilde.",
  },
  {
    id: "bereaved-children-current",
    title: "Helsedirektoratet: Ivaretakelse av barn som etterlatte",
    url: "https://www.helsedirektoratet.no/veiledere/parorendeveileder/informasjon-og-stotte-til-barn-som-parorende/ivaretakelse-av-barn-som-etterlatte",
    scope:
      "Faglig endret 29.06.2026; kontrollert 30.10.2026. Helsepersonell skal bidra til tilpasset informasjon og nødvendig oppfølging når mindreårige mister en forelder eller et søsken. Avklar barnets forståelse, behov, omsorgspersoner og støtte, så langt mulig sammen med dem som har omsorgen. Vurder tiltak individuelt; god oppfølging fra familien kan gjøre generell informasjon og tilbud om kontakt tilstrekkelig. Barn skal inkluderes på en måte som passer alder og forutsetninger. Innhent nødvendig samtykke til videre oppfølging og avtal konkrete kontakter. Opplysninger om avdøde er fortsatt underlagt rammene i helsepersonelloven § 24; dødsfallet opphever ikke taushetsplikten. Kommunale tjenester kan bidra etter dødsfall utenfor institusjon. Utdraget innebærer verken automatisk psykisk lidelse, obligatorisk kriseteam for alle eller full tilgang til avdødes opplysninger.",
  },
  {
    id: "bereavement-support-current",
    title: "Helsedirektoratet: Støtte til pårørende ved livets slutt og etter brå død",
    url: "https://www.helsedirektoratet.no/veiledere/parorendeveileder/stotte-familie-og-andre-parorende/stotte-til-parorende-ved-livets-slutt",
    scope:
      "Avsnittene om oppfølging etter dødsfall (29.06.2026) og brå død (18.01.2018) kontrollert 30.10.2026. Gi oversikt over hendelsen, emosjonell og praktisk støtte og informasjon om forventede reaksjoner. Tilpass tilbud om syning, ritualer og samtaler til familiens ønsker. Vurder barnas behov og tilgjengelig støtte; avtal konkret videre kontakt og kontinuitet, og involver relevante lokale tjenester. Oppfølgingssamtale kan være særlig nyttig etter korte og dramatiske forløp. Vurder videre hjelpebehov individuelt, blant annet ved lite støtte, tidligere traumer eller vedvarende psykiske/sosiale vansker. Normale tidlige sorgreaksjoner er ikke i seg selv en sykdomsdiagnose. Utdraget gir ikke regler for dødsfastsettelse, politivarsling, obduksjon eller medikamentell behandling.",
  },
  {
    id: "postoperative-analgesia-current",
    title: "Norsk legemiddelhåndbok: Postoperativ smertebehandling",
    url: "https://www.legemiddelhandboka.no/extended/anestesi/postoperativ-fase/postoperativ-smertebehandling",
    scope:
      "Revidert 12.12.2024; generelle prinsipper og opioidavsnitt lest 30.10.2026. Utilstrekkelig lindring kan svekke mobilitet, ventilasjon og hostekraft. Multimodal behandling balanserer smertelindring mot bivirkninger. Opioider kan bidra til sedasjon, respirasjonshemming, retensjon og ileus. Følsomheten varierer, og effekt og bivirkninger må observeres systematisk etter administrasjon. Morfinmetabolitter kan hope seg opp ved nyresvikt. Ved opioidutløst respirasjonshemming prioriteres tilstrekkelig ventilasjon, rask medisinsk vurdering og individuelt titrert reversering når indisert; fortsatt behov for smertelindring inngår i revurderingen. Postoperativ bruk skal vurderes i sin egen kliniske sammenheng, ikke automatisk etter et regime for stort forgiftningsinntak. Utdraget gir ingen eksakte opioid-/naloksondoser, erstatningsordinasjoner eller universell overvåkningsfrekvens.",
  },
  {
    id: "methadone-poisoning-current",
    title: "Giftinformasjonen: Metadonforgiftning",
    url: "https://www.helsebiblioteket.no/forgiftninger/legemidler/metadon-behandlingsanbefaling-ved-forgiftning",
    scope:
      "Revidert 2024; kontrollert 30.10.2026. Metadon kan gi langvarig CNS-/respirasjonsdepresjon og hjertepåvirkning, inkludert QT-forlengelse og arytmier. Miose er ikke alltid til stede, og en vanlig opioidscreening påviser ikke nødvendigvis metadon. Samtidige sedativa, toleranse, elektrolytter og øvrig QT-risiko er relevante. Sikre luftvei og adekvat ventilasjon; nalokson vurderes etter klinikken, men effekten kan opphøre mens metadoneffekten vedvarer. Hjertepåvirkning reverseres ikke nødvendigvis av nalokson. Overvåk respirasjon, bevissthet og sirkulasjon, med tolket EKG og rytmeovervåkning ved relevant risiko. Konferer lege/Giftinformasjonen om videre behandling og observasjon. Utdraget gir ingen toksisk dosegrense, antidotregime eller fast utskrivningstid.",
  },
  {
    id: "buprenorphine-poisoning-current",
    title: "Giftinformasjonen: Buprenorfinforgiftning",
    url: "https://www.helsebiblioteket.no/forgiftninger/legemidler/buprenorfin-behandlingsanbefaling-ved-forgiftning",
    scope:
      "Revidert 2024; kontrollert 30.10.2026. Buprenorfin kan gi gradvis innsettende og langvarig CNS-/respirasjonsdepresjon. Risikoen påvirkes av administrasjonsvei, samtidig alkohol/sedativa og individuell følsomhet. Delvis agonisme betyr ikke at alvorlig forgiftning er umulig. Frie luftveier og adekvat ventilasjon prioriteres. Naloksonrespons kan være langsommere og mindre fullstendig enn ved rene opioidagonister; fortsatt støtte og vurdering av andre årsaker må ikke utsettes. Følg respirasjon, bevissthet og sirkulasjon og konferer lege/Giftinformasjonen om varighet og videre behandling. Utdraget gir ingen eksakte antidotdoser, infusjonsoppskrift eller utskrivningsfrist. Kildens infusjonsavsnitt har en legemiddelnavn-inkonsistens og er ikke brukt som behandlingsgrunnlag her.",
  },
  {
    id: "oxycodone-poisoning-current",
    title: "Giftinformasjonen: Oksykodonforgiftning",
    url: "https://www.helsebiblioteket.no/forgiftninger/legemidler/oksykodon-behandlingsanbefaling-ved-forgiftning",
    scope:
      "Revidert 2024; kontrollert 30.10.2026. Oksykodon kan gi CNS-/respirasjonsdepresjon; depotform kan gi langvarig påvirkning. Vurder faktisk preparat/formulering, inntakstid, toleranse, samtidig inntak og klinisk utvikling. Sikre luftvei og ventilasjon og vurder nalokson etter klinikken. Respons opphever ikke behovet for fortsatt observasjon, fordi opioidvirkning kan vedvare etter antidoteffekten. Hos opioidtilvente avveies nødvendig reversering mot kraftig abstinens; målet er forsvarlig respirasjon. Følg våkenhet, respirasjon og sirkulasjon. Utdraget fastsetter ingen toksisk dose, antidotdose eller universell observasjonstid; slike råd krever konkret vurdering av eksponering og forløp.",
  },
  {
    id: "lar-acute-pain-current",
    title: "OUS: Opioidavhengige pasienter og akutt smerte",
    url: "https://metodebok.no/emne/g8c6tmxY/opioidavhengige-pasienter/ortopedi-(ous)",
    scope:
      "Versjon 2.0, faglig oppdatert 12.04.2026; full tekst lest 30.10.2026. Pasienter i LAR trenger vurdering og lindring av akutt smerte på lik linje med andre. Skill forebygging av abstinens fra behandling av den akutte smerten. Opioidtoleranse kan øke analgetikabehovet, men beskytter ikke mot respirasjonsdepresjon ved høye doser eller kombinasjoner. I det perioperative forløpet videreføres normalt bekreftet metadon-/buprenorfinbehandling, og ekstra analgesi planlegges individuelt med lege og ved behov smerte-/LAR-team. Vurder multimodal lindring, ikke-medikamentelle tiltak og egnede ikke-opioide midler ut fra kontraindikasjoner. Buprenorfin utelukker ikke analgetisk effekt av andre opioider. Følg smerte, funksjon, sedasjon og respirasjon. Dette er ortopedisk/perioperativ prinsippstøtte, ikke en ordre om uendret dose ved forgiftning, ukjent faktisk inntak eller behandlingsopphold. Utdraget gir ingen eksakte tilleggsdoser, konverteringer eller gjenopptrappingsplaner.",
  },
  {
    id: "upper-gi-bleeding-current",
    title: "Helse Bergen: Hematemese og melena",
    url: "https://metodebok.no/emne/TeibwPvU/hematemese-og-melena-(%C3%B8vre-gi-bl%C3%B8dning)/metodebok-i-akutt-indremedisin-(hus)",
    scope:
      "Versjon 2.0, publisert 27.06.2024; relevante avsnitt lest i indeksert primærtekst 30.10.2026, direkte åpning ga 403. Ved mulig øvre gastrointestinal blødning vurderes blodtrykk, puls, bevissthet, perifer sirkulasjon, respirasjon, pågående blødning og komorbiditet samlet. Betydelig blødning krever rask legevurdering, stabilisering og avklaring av videre gastroenterologisk håndtering. Legemiddel- og antikoagulasjonshistorie er viktig; reversering ved livstruende blødning må vurderes konkret av lege. Overvåkningsnivå tilpasses alvorlighet, og utvikling i hemoglobin og tegn til reblødning følges. Lokal avdelingsplassering er ikke en universell regel. Utdraget gir ikke transfusjonsgrenser, reverseringsdoser, endoskopiske prosedyrer eller et eksakt PPI-/variceregime.",
  },
  {
    id: "lower-gi-bleeding-current",
    title: "Helse Bergen: Nedre gastrointestinal blødning",
    url: "https://metodebok.no/emne/vMwyYZCx/nedre-gastrointestinal-bl%C3%B8dning/metodebok-i-gastrokirugi-(hus)",
    scope:
      "Versjon 3.0, faglig oppdatert 20.03.2026; lest 30.10.2026. Friskt blod per rektum er ikke alltid nedre blødning: kraftig øvre blødning kan gi hematochezi, og enkelte nedre kilder kan gi melena. Sammenhold blødningsforløp, hemodynamikk, hemoglobinutvikling, abdominalfunn, antikoagulasjon/platehemmere og komorbiditet. Betydelig eller pågående blødning, sirkulasjonspåvirkning og manglende forsvarlig oppfølging taler for innleggelse. Lavrisikovurdering krever helhet og egnet oppfølging; en skår alene avgjør ikke. Stabilisering og avklaring av blødningskilden tilpasses aktiviteten i blødningen og tilgjengelig spesialistkompetanse. Utdraget gir ikke skårtabeller, transfusjons-/væskeregimer eller detaljerte valg av endoskopi, angiografi eller kirurgi.",
  },
  {
    id: "bleeding-hemoglobin-interpretation",
    title: "International Consensus Group: Hemoglobin ved akutt GI-blødning",
    url: "https://www.cag-acg.org/_Library/clinical_cpgs_position_papers/CAG-CPG-Nonvariceal-UGIB-Annals-Dec2019.pdf",
    scope:
      "Retningslinje fra 2019, trykt side 811 (PDF-side 7), tekst kontrollert 30.10.2026. Avgrenset til tolkningen av hemoglobin ved akutt blodtap: verdien kan tidlig være uendret fra utgangspunktet fordi plasmafordelingen ennå ikke har nådd likevekt. Ett normalt eller stabilt tidlig Hb-svar utelukker derfor ikke betydelig pågående blødning. Vurder klinisk sirkulasjon, blødningsforløp og utvikling samlet. Denne eldre kilden brukes her for dette fysiologiske prinsippet, ikke som en aktuell norsk transfusjonsgrense eller behandlingsprotokoll.",
  },
  {
    id: "adult-asthma-current",
    title: "GINA 2026: Akutt astma, ventilasjon og behandlingsrespons",
    url: "https://ginasthma.org/wp-content/uploads/2026/05/GINA-2026-Strategy-Report-WMS.pdf",
    scope:
      "2026-rapporten, trykt side 185 (PDF-side 186), lest visuelt og som tekst 30.10.2026. Avgrenset her til voksne. Arteriell blodgass vurderes ved alvorlig obstruksjon, manglende initial respons eller forverring; nødvendig oksygen videreføres under prøvetaking. Ved astma er PaCO₂ ofte lav. Normal eller stigende PaCO₂ er derfor ikke automatisk betryggende ved fortsatt pustearbeid, utmattelse eller døsighet; vurder ventilasjon og oksygenering samlet. Røntgen er ikke rutine i alle anfall, men brukes ved relevant komplikasjons-/differensialmistanke eller manglende respons. Inhalerte bronkodilatatorer og kontrollert oksygen vurderes etter alvorlighet og respons. Høy eksponering for korttidsvirkende beta₂-agonister kan bidra til takykardi, hypokalemi, laktatstigning og hyperventilasjon; ikke tolk alle slike funn som økt obstruksjon uten ny vurdering. Internasjonal fagstøtte, ikke en full norsk astmaprosedyre. Utdraget fastsetter ikke eksakte doser, oksygenmål, intubasjonsgrenser eller behandling av småbarn.",
  },
  {
    id: "hyponatremia-current",
    title: "Norsk endokrinologisk forening: Hyponatremi",
    url: "https://metodebok.no/emne/6Naq7zH6/hyponatremi/nasjonal-veileder-i-endokrinologi",
    scope:
      "Versjon 1.10, publisert 24.06.2025; relevante avsnitt kontrollert i indeksert primærkildetekst 30.10.2026, direkte side ga 403. Vurder symptomutvikling, tidligere natrium, effektiv osmolalitet, volumstatus, inntak/tap, ernæring og legemidler samlet. Hyperglykemi og måleartefakt må skilles fra hypoton hyponatremi. Urinosmolalitet og urin-natrium hjelper årsaksvurderingen, men diuretika og nyresykdom begrenser enkel tolkning. SIAD er en utelukkingsdiagnose; vurder blant annet binyrebark-, thyreoidea- og nyrefunksjon. Ta relevante serum-/urinprøver før behandling når mulig, uten å forsinke nødvendig behandling av alvorlige symptomer. Både akutt hjernepåvirkning og for rask natriumkorreksjon kan være farlig. Følg nevrologi, natrium og diurese under behandling; korrigering av volumtap eller kalium og fjerning av utløsende årsak kan øke natrium raskt. Alkoholbruk, underernæring og hypokalemi øker risikoen ved overkorreksjon. Utdraget gir ingen universell væskestrategi, bolusdose eller korreksjonshastighet.",
  },
  {
    id: "hydroxyzine-contraindications",
    title: "Felleskatalogen: Atarax, QT-relaterte kontraindikasjoner",
    url: "https://www.felleskatalogen.no/medisin/atarax-ucb-546515",
    scope:
      "Kontraindikasjoner og forsiktighetsregler kontrollert 30.10.2026. Hydroksyzin er kontraindisert ved kjent ervervet eller medfødt QT-forlengelse, betydelig hypokalemi/hypomagnesemi og samtidig bruk av andre legemidler som forlenger QT eller kan utløse torsades de pointes. Dette er sterkere enn et generelt råd om forsiktighet. Preparatomtalen angir avbrudd og umiddelbar medisinsk hjelp ved tegn eller symptomer som kan skyldes hjertearytmi. Sammenhold tolket EKG, elektrolytter, symptomer og den faktiske legemiddellisten; risiko er ikke det samme som dokumentert arytmi. Kilden støtter rask avklaring av videre behandling med lege, ikke et bestemt erstatningspreparat eller en full elektrolytt-/reernæringsprotokoll.",
  },
  {
    id: "adult-aka-current",
    title: "Helse Bergen: Alkoholisk ketoacidose",
    url: "https://metodebok.no/emne/zbWeHy4d/alkoholisk-ketoacidose/metodebok-i-akutt-indremedisin-(hus)",
    scope:
      "Versjon 2.1, publisert 16.06.2025; diagnostikk og behandlingsmål lest 30.10.2026. Alkoholoverforbruk, lite næring, opphør av inntak, oppkast, ketonemi og økt aniongap vurderes samlet. Glukose er ofte normal eller lav, men kan være forhøyet; etanol kan være lavt eller ikke påvisbart. Vurder også diabetisk/fasterelatert ketoacidose, laktacidose, nyresvikt og toksiske eksponeringer. Følg blant annet glukose, ketoner, syre-base, kalium, magnesium, fosfat og nyrefunksjon. Behandlingsmålet er å bremse ketonproduksjon med karbohydrattilførsel, rehydrere og unngå komplikasjoner. Kalium kan falle under behandling. Dette utdraget gir ikke et eksakt væske-, insulin-, tiamin- eller elektrolyttregime; pasientens glukose, elektrolytter og klinikk styrer individuell legeledet behandling.",
  },
  {
    id: "toxic-alcohol-differential",
    title: "Giftinformasjonen: Etylenglykol, diagnostiske begrensninger",
    url: "https://www.helsebiblioteket.no/forgiftninger/gasser-og-kjemikalier/etylenglykol-behandlingsanbefaling-ved-forgiftning",
    scope:
      "Diagnostiske avsnitt kontrollert 30.10.2026. Ved uforklart metabolsk acidose med økt aniongap vurderes toksiske alkoholer sammen med øvrige årsaker og eksponeringshistorien. Lavt eller negativt etylenglykolnivå sent i forløpet kan skyldes omdanning til toksiske metabolitter; normalt osmolalt gap utelukker derfor ikke forgiftning. Tolk direkte analyser, tidspunkt, nyrefunksjon, klinikk og utvikling samlet. Ikke bruk ett negativt svar som universell eksklusjon, og ikke la relevant differensialdiagnostikk forsinke nødvendig støttebehandling. Ved reell mistanke konfereres Giftinformasjonen/lege. Utdraget gir ingen antidot-, buffer- eller dialyseprotokoll og krever ikke slik behandling ut fra aniongap alene.",
  },
  {
    id: "adult-hhs-current",
    title: "Norsk endokrinologisk forening: Non-ketotisk diabetisk hyperglykemi",
    url: "https://metodebok.no/emne/P2KHP5d2/non-ketotisk-diabetisk-hyperglykemi/nasjonal-veileder-i-endokrinologi",
    scope:
      "Versjon 1.9, publisert 10.11.2025; relevante avsnitt kontrollert mot indeksert primærkildetekst 30.10.2026. HHS vurderes med uttalt hyperglykemi, dehydrering, osmolalitet, ketoner og syre-base samlet. Kilden angir effektiv osmolalitet over 300 mosmol/kg; dette er ikke samme størrelse som total målt osmolalitet. Effektiv osmolalitet beregnes som 2 × natrium + glukose når begge er i mmol/L. Oppgi beregningskonvensjonen hvis den etterspørres. Blanding med ketoacidose kan forekomme. Behandlingen individualiseres med væske, elektrolytter og insulin; insulinbehovet er vanligvis lavere enn ved DKA. Vurder hjerte- og nyrefunksjon og unngå overvæsking og for rask endring i effektiv osmolalitet. Følg bevissthet, glukose, elektrolytter, diurese og klinisk utvikling under medisinsk overvåkning. Utdraget gir ikke eksakte infusjonsregimer eller korreksjonshastigheter.",
  },
  {
    id: "adrenal-crisis-current",
    title: "Helse Bergen: Akutt binyrebarksvikt",
    url: "https://metodebok.no/emne/8LaBGHS5/akutt-binyrebarksvikt---addison-krise/metodebok-i-akutt-indremedisin-(hus)",
    scope:
      "Metodeboksiden oppgir publisering 16.06.2025; relevante avsnitt kontrollert mot indeksert primærkildetekst 30.10.2026. Akutt binyrebarksvikt kan forekomme ved primær eller sekundær svikt, også etter langvarig glukokortikoidbruk, og kan utløses av annen akutt sykdom. Hypotensjon, sirkulasjonssvikt, magesmerter, oppkast, hyponatremi eller hypoglykemi gir mistanke i riktig sammenheng. Livstruende mistanke krever rask lege-/sykehusbehandling med hydrokortison, sirkulasjonsstøtte og håndtering av utløsende årsak; vent ikke på hormonprøvesvar før nødvendig behandling. Utdraget omfatter voksne og gir ikke eksakte steroid-, væske- eller glukoseregimer.",
  },
  {
    id: "hyperkalemia-principles",
    title: "UK Kidney Association 2023: Akutt hyperkalemi hos voksne",
    url: "https://www.ukkidney.org/sites/default/files/FINAL%20VERSION%20-%20UKKA%20CLINICAL%20PRACTICE%20GUIDELINE%20-%20MANAGEMENT%20OF%20HYPERKALAEMIA%20IN%20ADULTS%20-%20191223_0.pdf",
    scope:
      "2023-retningslinjen, kontrollert 30.10.2026, særlig sykehusbehandling og vedlegg 7. Vurder kalium, endringstempo, nyrefunksjon, legemidler og tolket EKG sammen. Undersøk mulig prøvefeil, men ikke forsink nødvendig behandling av en ustabil pasient med klinisk mistenkt hyperkalemi. Normalt EKG er ingen garanti mot alvorlig arytmi ved betydelig hyperkalemi. Skill hjertebeskyttelse med intravenøst kalsium ved hyperkalemiske EKG-forandringer fra tiltak som flytter kalium inn i celler eller fjerner kalium fra kroppen. Kalsium senker ikke kaliumverdien. Følg kalium og glukose etter behandling; insulin medfører risiko for hypoglykemi, og kalium kan stige igjen. Ved vedvarende alvorlig forstyrrelse vurderes dialyse med spesialist. Britisk prinsippstøtte, ikke en norsk ordinasjonsprosedyre; utdraget gir ingen doser eller universelle behandlingsgrenser.",
  },
  {
    id: "head-injury-current",
    title: "NICE NG232: Hodeskade, observasjon og videre vurdering",
    url: "https://www.nice.org.uk/guidance/ng232/chapter/Recommendations",
    scope:
      "Relevante anbefalinger 1.3, 1.4, 1.5, 1.9 og 1.10 kontrollert mot indeksert primærkildetekst 30.10.2026. Sammenhold skademekanisme, bevissthetstap/amnesi, GCS med delskårer, nevrologi, antikoagulasjon og CT. Nye klinisk viktige bildefunn eller manglende retur til tidligere GCS/bevissthet taler for innleggelse og observasjon. Symptomlindring utelukker ikke intrakraniell skade. Revurder straks ved nevrologisk forverring; avklar relevant nevrokirurgisk drøfting og eventuell overføring. Ved intrakraniell blødning under antikoagulasjon må behov for reversering avklares raskt med lege. Hjemreise krever klinisk vurdering, forsvarlig tilsyn og forståelig informasjon om faresignaler. Britisk fagstøtte; utdraget gir ikke eksakte skanningsfrister, operasjonsgrenser, reverseringsdoser eller en full norsk traumeprosedyre.",
  },
  {
    id: "hypoglycemia-current",
    title: "Norsk legemiddelhåndbok: Hypoglykemi ved diabetes",
    url: "https://www.legemiddelhandboka.no/extended/endokrine-sykdommer/diabetes-mellitus",
    scope:
      "Hypoglykemiavsnittet oppgir revisjon 07.01.2026; kontrollert 30.10.2026. Vurder balansen mellom glukosesenkende behandling, matinntak og aktivitet; feildosering og alkohol kan bidra. Symptomterskelen varierer, og langvarig diabetes kan svekke varselsymptomene. Nedsatt bevissthet hos en person med diabetes krever rask glukoseavklaring og behandling av hypoglykemi. Raskt absorberbare karbohydrater er aktuelt når pasienten kan ta dem trygt; ved manglende evne til peroral behandling vurderes parenteral glukose eller glukagon etter klinikk og tilgjengelig hjelp. Bevisstløse skal ikke gis drikke. Revurder glukose og klinisk respons, og avklar årsak og videre behandling med lege. Utdraget gir ikke eksakte doser, observasjonstid, førerkortregler eller et fullstendig regime for sulfonylureaforgiftning.",
  },
  {
    id: "bronchiolitis-current",
    title: "Norsk barnelegeforening: Akutt bronkiolitt",
    url: "https://www.helsebiblioteket.no/innhold/retningslinjer/pediatri/akuttveileder-i-pediatri/7.lunge-og-luftveissykdommer-inkludert-luftveisinfeksjoner/7.4-akutt-bronkiolitt",
    scope:
      "Nettsiden oppgir faglig oppdatering 01.01.2019; kontrollert 30.10.2026. Norsk avgrensning er første leveår. Vurder pustearbeid, luftpassasje, kontakt, apneer, oksygenering og drikkeevne samlet. Prematuritet og tidligere neonatale respirasjonsproblemer øker risiko. Virusfunn kan støtte årsaken, men bestemmer ikke alvorlighet eller omsorgsnivå. Blodgass, andre blodprøver og røntgen tas på klinisk indikasjon. Behandlingen er støttende med ro, oksygen og ernærings-/væskestøtte etter behov; sonde eller intravenøs væske vurderes etter toleranse og alvorlighet. Unngå overvæsking. Inhalasjonsmidler, steroider og antibiotika brukes ikke rutinemessig ved bronkiolitt. Utmattelse, apneer eller sviktende gassutveksling krever rask vurdering av respirasjonsstøtte og høyere omsorgsnivå. Utdraget gir ikke eksakte oksygenmål, væskemengder, legemiddeldoser eller en komplett utskrivningsprosedyre.",
  },
  {
    id: "pediatric-gastroenteritis",
    title: "Norsk barnelegeforening: Akutt gastroenteritt og dehydrering",
    url: "https://www.helsebiblioteket.no/innhold/retningslinjer/pediatri/akuttveileder-i-pediatri/5.sykdommer-i-mage-tarm-trakt-lever-og-pancreas/5.3-akutt-gastroenteritt-og-dehydrering",
    scope:
      "Faglig oppdatert 01.01.2021; kontrollert 30.10.2026. Vurder inntak, oppkast/diaré, urin, aktivitet, kontakt, perfusjon og hydreringsfunn samlet. En nylig sammenlignbar vekt kan støtte beregning av væsketap, men et prosenttall erstatter ikke klinisk alvorlighetsvurdering. Blodprøver er særlig relevante ved påvirket barn, lav alder eller usikker differensialdiagnose. Tenk på hypoglykemi og elektrolyttforstyrrelser. Lett dehydrering hos et ellers kvikt barn kan håndteres med drikke og oppfølging; moderat eller alvorlig dehydrering krever sykehusvurdering. Oral rehydreringsløsning eller sonde kan brukes når klinikken tillater det. Alvorlig dehydrering eller manglende mulighet for tilstrekkelig enteral rehydrering krever intravenøs behandling. Utdraget gir ikke et dose- eller infusjonsregime; videre strategi styres av sirkulasjon og elektrolytter.",
  },
  {
    id: "pediatric-hypovolemia",
    title: "Norsk barnelegeforening: Hypovolemi og dehydrering med elektrolyttforstyrrelser",
    url: "https://www.helsebiblioteket.no/innhold/retningslinjer/pediatri/akuttveileder-i-pediatri/1.akutte-prosedyrer-og-tilstander-inkludert-ulykker/1.7-hypovolemisk-sirkulasjonssvikt-og-inkludert-alvorlig-dehydrering-med-elektrolyttforstyrrelser",
    scope:
      "Faglig oppdatert 01.01.2021; kontrollert 30.10.2026. Takykardi, forsinket kapillærfylning, redusert bevissthet og oliguri kan vise sirkulasjonssvikt før hypotensjon, som er et sent tegn hos barn. Ved hypovolemisk sjokk er tidlig isoton væskebehandling med gjentatt vurdering av effekt viktig; følg også tegn til overvæsking og vurder annen årsak ved utilstrekkelig respons. Skill initial stabilisering av perfusjon fra videre korreksjon av væske- og natriumavvik. Hypernatremisk dehydrering krever kontrollert langsom korreksjon etter initial stabilisering, med oppfølging av kontakt/nevrologi, diurese, elektrolytter, glukose og syre-base. Rask natriumreduksjon kan skade; høyt natrium er samtidig ikke grunn til å utsette nødvendig sirkulasjonsstøtte. Utdraget gir ikke eksakte boluser, korreksjonshastigheter eller en full intensivprotokoll.",
  },
  {
    id: "emergency-disclosure",
    title: "Helsedirektoratet: Helsepersonelloven § 31, opplysninger til nødetater",
    url: "https://www.helsedirektoratet.no/rundskriv/helsepersonelloven-med-kommentarer/opplysningsplikt-m.v/-31.opplysninger-til-nodetater",
    scope:
      "Kontrollert 29.10.2026. Helsepersonell må varsle politi eller brannvesen når dette er nødvendig for å hindre alvorlig skade på personer eller eiendom. Vurder konkret sannsynlighet, mulig skadeomfang og om opplysningene kan forebygge eller begrense skaden. Plikten er ikke begrenset til øyeblikkelig akutte situasjoner. Dette er en forebyggende opplysningsplikt, ikke en generell hjemmel for å gi politiet helseopplysninger til etterforskning. En tidligere voldshendelse eller pasientens ønske avgjør ikke alene om plikten gjelder. Vurder sikkerhet og rettslig grunnlag konkret; bestemmelsen gir ikke i seg selv hjemmel til å holde pasienten tilbake.",
  },
  {
    id: "violence-aversion-duty",
    title: "Bufdir: Avvergingsplikt ved vold og overgrep",
    url: "https://www.bufdir.no/vold/aresrelatert/lovverk/",
    scope:
      "Kontrollert 29.10.2026. Straffeloven § 196 pålegger alle, også personer med taushetsplikt, å søke å avverge bestemte alvorlige lovbrudd når det er kjent eller mest sannsynlig at de vil skje. Mishandling i nære relasjoner er blant lovbruddene som omfattes. Avverging kan skje ved varsling eller andre virksomme tiltak. Vurder gjentakelse, eskalering og trusler konkret; dette er ikke automatisk anmeldelsesplikt ved enhver skade eller uenighet om hjemreise. Kilden er et avgrenset grunnlag for vurdering av avvergingsbehov, ikke en fullstendig strafferettslig prosedyre eller hjemmel for tvangsbehandling.",
  },
  {
    id: "somatic-care-scope",
    title: "Helsedirektoratet: Pasient- og brukerrettighetsloven § 4A-2",
    url: "https://www.helsedirektoratet.no/rundskriv/pasient-og-brukerrettighetsloven-med-kommentarer/helsehjelp-til-pasienter-uten-samtykkekompetanse-som-motsetter-seg-helsehjelpen-mv/-4a-2-virkeomrade",
    scope:
      "Faglig endret 29.05.2026, kontrollert 29.10.2026. Kapittel 4A gjelder helsehjelp til pasienter over 16 år som mangler beslutningskompetanse for den aktuelle hjelpen og motsetter seg den. Det kan være aktuelt for somatisk helsehjelp; motstand mot undersøkelse eller behandling av psykisk lidelse reguleres av psykisk helsevernloven. Tjenester som ikke er helsehjelp omfattes ikke automatisk. Virkeområdet alene gir ingen adgang til tvang; konkrete vilkår og formkrav må vurderes særskilt.",
  },
  {
    id: "somatic-care-resistance",
    title: "Helsedirektoratet: Pasient- og brukerrettighetsloven § 4A-3",
    url: "https://www.helsedirektoratet.no/rundskriv/pasient-og-brukerrettighetsloven-med-kommentarer/helsehjelp-til-pasienter-uten-samtykkekompetanse-som-motsetter-seg-helsehjelpen-mv/-4a-3-adgang-til-a-gi-helsehjelp-som-pasienten-motsetter-seg",
    scope:
      "Kontrollert 29.10.2026; brukes bare innen virkeområdet i § 4A-2. Forsøk tilpassede tillitsskapende tiltak før helsehjelp mot motstand, med et snevert unntak når forsøk klart ikke kan føre frem. Ved vedvarende motstand kreves fare for vesentlig helseskade uten hjelp, nødvendig helsehjelp og forholdsmessige tiltak. En samlet vurdering må vise at hjelpen klart er den beste løsningen for pasienten; motstandens styrke og muligheten for snart å gjenvinne beslutningskompetanse inngår. Utforsk smerte, frykt, kommunikasjon og praktiske hindringer. Dette avgrensede utdraget er ikke en full vedtaks-, klage- eller øyeblikkelig-hjelp-prosedyre; involver ansvarlig kvalifisert helsepersonell og dokumenter konkrete vurderinger.",
  },
  {
    id: "croup-current",
    title: "Norsk barnelegeforening: Akutt laryngitt",
    url: "https://www.helsebiblioteket.no/innhold/retningslinjer/pediatri/akuttveileder-i-pediatri/7.lunge-og-luftveissykdommer-inkludert-luftveisinfeksjoner/7.9-akutt-laryngitt",
    scope:
      "Akuttveileder i pediatri, faglig oppdatert 07.03.2022, kontrollert 29.10.2026. Typisk gjøende hoste, heshet og inspiratorisk stridor etter forkjølelsessymptomer; diagnosen er vanligvis klinisk. Vurder stridor i hvile, inndragninger, luftpassasje, kontakt og cyanose samlet. Ro, nærhet til forelder og minst mulig unødig håndtering er viktig. Følg respirasjon og oksygenering; lege vurderer steroid og eventuelt adrenalininhalasjon etter alvorlighet. Vedvarende betydelige symptomer etter behandling krever videre sykehusvurdering. Barn under seks måneder vurderes særlig forsiktig. Etter adrenalininhalasjon anbefales 3–4 timers observasjon før eventuell hjemreise, som også forutsetter klinisk bedring, egnede forhold og returmulighet. Utdraget inneholder ikke barnedoser eller en komplett skåringsprosedyre; observasjonstiden er ikke en universell regel for alle barn med hoste.",
  },
  {
    id: "heart-failure-current",
    title: "Norsk legemiddelhåndbok: Hjertesvikt",
    url: "https://www.legemiddelhandboka.no/extended/hjerte-og-karsykdommer/hjertesvikt",
    scope:
      "Revidert 12.12.2025, kontrollert 29.10.2026. Sammenhold symptomer, stuvningsfunn, natriuretiske peptider, EKG og ekkokardiografi; ejeksjonsfraksjon beskriver ikke alene den aktuelle væskebelastningen. Ved redusert ejeksjonsfraksjon vurderes sykdomsmodifiserende legemidler og diuretika etter indikasjon og toleranse. Blodtrykk, puls, elektrolytter og nyrefunksjon følges ved endringer. RAAS-hemmere og aldosteronantagonister kan bidra til hyperkalemi; betablokkere krever oppmerksomhet på bradykardi, ledningsforstyrrelse og hemodynamikk. Væsketap og stuvning krever forskjellige avveininger. Oppfølging, pasientforståelse og avtalt egenobservasjon inngår. Utdraget støtter individuell revurdering, ikke automatiske legemiddelordrer eller eksakte dose-, væske- og korreksjonsregimer.",
  },
  {
    id: "heart-failure-decongestion",
    title: "ESC 2021: Akutt hjertesvikt, avlastning og utskrivningsvurdering",
    url: "https://academic.oup.com/eurheartj/article/42/36/3599/6358045",
    scope:
      "Kapittel 11.3.3 og 11.3.11 samt nyrefunksjonsavsnitt, kontrollert mot indeksert primærkildetekst 29.10.2026. Intravenøse diuretika brukes ved akutt hjertesvikt med væskeoverbelastning. Vurder respons tidlig og gjentatt med diurese, klinisk stuvning, væskebalanse, elektrolytter og nyrefunksjon. En liten kreatininøkning avgjør ikke alene om diuretika skal stoppes eller væske gis; vurder hemodynamikk og oppnådd avlastning. Vedvarende stuvning ved utskrivning er forbundet med dårligere prognose. Overgang til peroral behandling forutsetter klinisk stabilitet; videre plan skal begrunnes og følges opp. Hemodynamisk ustabilitet, alvorlig nyrepåvirkning eller hyperkalemi kan nødvendiggjøre endring av øvrig hjertesviktbehandling. Europeisk prinsippstøtte, ikke en komplett oppdatert norsk ordinasjonsprotokoll; ingen eksakte doser eller universelle kreatiningrenser inngår i utdraget.",
  },
  {
    id: "anaphylaxis-current",
    title: "Felleskatalogen: Anafylaksi",
    url: "https://www.felleskatalogen.no/medisin/anafylaksi",
    scope:
      "Kontrollert 29.10.2026, oppdatert 05.01.2026. Anafylaksi utvikles raskt med påvirket luftvei, pust eller sirkulasjon, ofte sammen med hudsymptomer. Tilkall hjelp, stans utløsende eksponering og tilpass leie til pust og sirkulasjon. Adrenalin er første legemiddel: voksne 0,5 mg intramuskulært i lårets utside (0,5 ml av 1 mg/ml), gjentas etter 5 minutter ved utilstrekkelig respons. Ikke forveksle med intravenøs bolus. Vurder luftvei, oksygen og intravenøs krystalloid væske etter tilstand; følg bevissthet, respirasjon, metning, rytme og blodtrykk. Antihistamin mot hudsymptomer etter stabilisering erstatter ikke adrenalin. Støtter umiddelbar klinisk handling uten å vente på blodgass eller laboratoriebekreftelse. Barnedoser og presis observasjonstid er ikke dekket av dette utdraget.",
  },
  {
    id: "adult-dka-current",
    title: "Norsk endokrinologisk forening: Diabetisk ketoacidose",
    url: "https://metodebok.no/emne/cNDwBsin",
    scope:
      "Faglig oppdatert 24.06.2025; diagnostikk og behandlingsnivå kontrollert mot indeksert kildetekst 29.10.2026. DKA krever diabetes/hyperglykemi, acidose og ketose sammen. Glukose over 11 mmol/L eller kjent diabetes, pH høyst 7,3 eller bikarbonat høyst 18 mmol/L, og ketoner over 3 mmol/L støtter diagnosen. Blodketoner foretrekkes; venøs eller arteriell pH kan brukes. SGLT2-hemmere kan gi alvorlig ketoacidose med beskjedent glukosenivå. Alvorlighet, bevissthet, hypoksi, arytmi, graviditet og hjerte-, lever- eller nyresvikt påvirker behovet for overvåkning/intensivbehandling. Dette verifiserte utdraget gir ikke et komplett væske-, insulin- eller kaliumregime; ikke utled eksakte doser eller korreksjonsgrenser fra det.",
  },
  {
    id: "eating-disorders",
    title: "Helsedirektoratet: Utredning av spiseforstyrrelser i spesialisthelsetjenesten",
    url: "https://www.helsedirektoratet.no/retningslinjer/spiseforstyrrelser/utredning-av-spiseforstyrrelser/utredning-av-spiseforstyrrelser-i-spesialisthelsetjenesten",
    scope:
      "Kontrollert 27.10.2026. Psykisk og somatisk vurdering hører sammen. Kartlegg vektutvikling, matinntak, oppkast, svimmelhet, trening og legemidler; undersøk puls, blodtrykk og øvrig somatikk. Laboratorieprøver etter indikasjon. EKG med QTc-vurdering er aktuelt ved risiko for rytmeforstyrrelse, blant annet elektrolyttforstyrrelser, eller mistanke om hjertesvikt. Spesialistkilde: støtter begrunnelse for somatisk avklaring/konferering i førstelinjen, ikke en komplett innleggelsesregel, numeriske QTc-grenser eller reernæringsprotokoll.",
  },
  {
    id: "qt-risk",
    title: "Felleskatalogen: Atarax, interaksjoner",
    url: "https://www.felleskatalogen.no/medisin/atarax-ucb-546515",
    scope:
      "Kontrollert 27.10.2026. Hydroksyzin kombinert med escitalopram eller citalopram kan gi additive QT-effekter og økt risiko for alvorlig arytmi; kombinasjonene bør generelt unngås. Støtter kontroll av legemiddelliste, interaksjonsvurdering og kontakt med forskriver. Beviser ikke at et symptom skyldes arytmi og gir ikke et selvstendig grunnlag for dosering eller valg av erstatningspreparat.",
  },
  {
    id: "syncope",
    title: "NICE CG109: Transient loss of consciousness, over 16s",
    url: "https://www.nice.org.uk/guidance/CG109/chapter/recommendations",
    scope:
      "Kontrollert 27.10.2026, anbefaling 1.1.1–1.1.2 og 1.2.1/1.3.1. Ved mistenkt kortvarig bevissthetstap: innhent pasient- og vitnebeskrivelse før/under/etter, gjennomgå sykdommer og legemidler som diuretika, vurder vitalia og EKG. Liggende/stående blodtrykk når klinisk passende; ikke fremprovoser fall hos ustabil eller skadet pasient. Vedvarende tvil krever videre vurdering. Gjelder over 16 år. Britisk fagstøtte, ikke norsk prosedyre; ingen fasit for væskebehandling eller seponering.",
  },
  {
    id: "hip-injury",
    title: "NICE CG124: Mistanke om hoftenært brudd etter negativt røntgen",
    url: "https://www.nice.org.uk/guidance/cg124/chapter/Recommendations",
    scope:
      "Kontrollert 27.10.2026, anbefaling 1.1.1. Ved fortsatt mistanke om hoftebrudd til tross for adekvat negativt røntgen anbefales MR; CT vurderes hvis MR ikke er tilgjengelig innen 24 timer eller er kontraindisert. Støtter videre lege-/sykehusavklaring ved vedvarende smerte og funksjonstap; et negativt røntgen alene avgjør ikke trygg hjemreise. Britisk fagstøtte, ikke en generell norsk utskrivningsregel.",
  },
  {
    id: "deterioration",
    title: "NICE CG50: Oppdage og håndtere klinisk forverring hos voksne i sykehus",
    url: "https://www.nice.org.uk/guidance/CG50/chapter/recommendations",
    scope:
      "Kontrollert 27.10.2026, anbefaling 1.1–1.12. Voksne i akutt sykehus: registrer puls, respirasjon, systolisk blodtrykk, bevissthet, oksygenmetning og temperatur; ha en dokumentert observasjonsplan. Klinisk bekymring kan utløse respons uavhengig av skår. Revurder respons og nødvendig behandlingsnivå, involver kompetent personell. Fagstøtte for observasjon/eskalering i sykehus; ikke diagnosespesifikk behandling, barneskår eller inn-/utskrivningsregel for KAD.",
  },
  {
    id: "treatment-goals",
    title: "Helsedirektoratet: Beslutningsprosesser for behandlingsavklaringer",
    url: "https://www.helsedirektoratet.no/veiledere/behandlingsavklaringer-ved-livsbegrensende-eller-alvorlig-langvarig-sykdom/beslutningsprosesser-for-behandlingsavklaringer",
    scope:
      "Kontrollert 27.10.2026. Tverrfaglige behandlingsavklaringer bygger på oppdatert informasjon om behandlingsmål, pasientens ønsker og verdier. Voksne pasienter skal få medvirke. Når beslutningskompetanse mangler, vurderer behandlende lege livsforlengende behandling i pasientens interesse etter samråd med kvalifisert helsepersonell, og innhenter der mulig nærmeste pårørendes opplysninger om antatte ønsker. Pårørende overtar ikke behandlingsansvaret. Ingen generell adgang til tvang eller automatisk behandlingsbegrensning ut fra alder/diagnose.",
  },
  {
    id: "study-guide",
    title: "Studiehefte MAKS790 2026",
    url: "https://drive.google.com/file/d/1A_UWXr629jqOACzwIkxDeyQCXmkq_JXD/view",
    scope:
      "Læringsutbytte s. 3–5 og undervisningsplan. Understøtter systematisk vurdering, prioritering, legemiddelvurdering, kommunikasjon, etikk og helhetlig pasientforløp. Dokumenterer ikke konkrete behandlingsdoser eller sensorfasit.",
  },
  {
    id: "assignment-1",
    title: "Arbeidskrav 1, gruppe 1–10",
    url: "https://docs.google.com/document/d/1kw4lV_QV9UWkIrcM_dKOQHHKxYbbMCuQ/edit",
    scope:
      "Tidligere eksamenseksempler ifølge brukeren. Oppgavebredde: prioritering av barn, alvorlig somatikk, behandlingsmål, overlevering, tolk, vold, ungdom, LAR, intoksikasjon og pårørende. Utsagn og behandling i scenarioene skal drøftes kritisk; de er ikke kliniske anbefalinger eller statistikk over sannsynlige eksamenstema.",
  },
  {
    id: "assignment-2",
    title: "Arbeidskrav 2, Randi, del 1–3",
    url: "https://docs.google.com/document/d/1SqZdYxseqppD6J6fdmCFkPdxMO_LDBjo/edit",
    scope:
      "Tidligere eksamenseksempel ifølge brukeren: planlegging prehospitalt, forsvarlig utskrivelse og revurdering ved forverring på KAD. Funksjon, pasientønske og legemidler påvirker beslutningen. Originalens relasjon mellom enkelte målinger og morfin er tvetydig; den beviser ikke at målingene ble tatt før morfin. Nye caser må ha eksplisitt tidslinje og komplett relevant medikamenthistorikk. Eksemplet er nivå-/breddegrunnlag, ingen behandlingsfasit.",
  },
  {
    id: "self-harm",
    title: "Møte med pasient med selvskade, s. 1–2",
    url: "https://drive.google.com/file/d/11Gac1Qjz0jkuixIOqUzl5ameLqnPI4lq/view",
    scope:
      "Læringsmål: kontakt, verbal og ikke-verbal kommunikasjon og vurdering av akutt suicidalitet. Ikke alle oppgaver trenger ABCDE. Krenkende holdninger i legerollen er problematiske, ikke anbefalt praksis.",
  },
  {
    id: "pediatrics",
    title: "Markestad: Vurdering av akutt syke barn",
    url: compendium,
    scope:
      "Kompendium s. 99–117 (Markestad). Vurder kontakt, respirasjonsarbeid, hud/perfusjon og hydrering sammen med alder, utvikling og foreldrenes beskrivelse av endring. Bronkiolitt, øvre luftveisobstruksjon og dehydrering kan gi redusert drikkeevne og kontakt. Feber alene angir ikke alvorlighet. Barnets vekt og eksakte alder må følge aldersavhengige vurderinger; voksen NEWS2 brukes ikke. Kapitlet støtter klinisk gjenkjenning og prioritering, ikke improviserte barnedoser.",
  },
  {
    id: "geriatrics",
    title: "Wyller: Generelle symptomer og skrøpelighet",
    url: compendium,
    scope:
      "Kompendium s. 176–189, Wyller. Akutt funksjonsfall kan skyldes infeksjon, hjertesvikt, infarkt, emboli, nyresvikt, gastrointestinal blødning, urinretensjon, legemidler, diabetes eller slag. Sammenlign tempo og utgangsfunksjon/kognisjon; flere akutte årsaker kan foreligge samtidig. Normal metning utelukker ikke betydningen av takypné. Positiv urinprøve alene fastslår ikke årsaken. Hjertesvikteksemplet integrerer symptomer, tolket EKG, NT-proBNP, nyrefunksjon og respons. Skrøpelighet og støtte påvirker videre forløp.",
  },
  {
    id: "acute-kidney-current",
    title: "OUS: Generelt om akutt nyreskade",
    url: "https://metodebok.no/index.php?action=topic&item=YwXG8gK3",
    scope:
      "Faglig oppdatert 06.08.2025; relevante avsnitt kontrollert mot indeksert kildetekst 28.10.2026. Sammenhold akutt kreatininendring og diurese; kreatinin kan være en sen markør. Skill prerenal hypoperfusjon, intrarenal skade og postrenal obstruksjon. Dehydrering hos eldre, særlig ved hjertesvikt eller annen sårbarhet, kan gi hypoperfusjon; ACE-hemmer/ARB og NSAID kan bidra og revurderes i denne konteksten. Langvarig hypoperfusjon kan utvikle tubulær skade. Stuvningsdominert hjertesvikt krever en annen væske-/diuretikavurdering enn hypovolemi. Følg væskebalanse og elektrolytter. Dialysebehov vurderes ut fra komplikasjoner og utvikling med nefrolog, ikke kreatinin alene. Dette utdraget gir ikke eksakte dose- eller korreksjonsregimer.",
  },
  {
    id: "nsaid-renal-current",
    title: "Felleskatalogen/DMP: Ibux tabletter/kapsler – nyre og interaksjoner",
    url: "https://www.felleskatalogen.no/medisin/ibux-karo-pharma-559957",
    scope:
      "Kontrollert 28.10.2026; FK-tekst basert på SPC 13.09.2024 og DMPs viste interaksjonstekst. Ibuprofen hemmer prostaglandinsyntesen og kan svekke nyrefunksjonen, særlig hos eldre og ved dehydrering eller eksisterende nyresykdom. Samtidig ACE-hemmer/ARB eller diuretika kan øke risikoen for nyresvikt og forverret hjertesvikt. Vurder blodtrykk, kreatinin, kalium og stuvning. Reseptfri tilgjengelighet innebærer ikke fravær av risiko. Numerisk inntakshistorikk og formulering beholdes for eksponeringsvurderingen. Oppgitte historiske doser er ikke en ny ordinasjon; valg av videre smertelindring må tilpasses pasienten.",
  },
  {
    id: "first-actions",
    title: "Haugen: De første livreddende tiltakene",
    url: compendium,
    scope:
      "Kompendium s. 344–347. Ledelse, sikkerhet, oversikt, varsling og livreddende vurdering etter (C)ABCDE. Vurder egne kompetansegrenser og tilkall bistand.",
  },
  {
    id: "respiration",
    title: "Jacobsen mfl.: Respirasjonssvikt",
    url: compendium,
    scope:
      "Kompendium s. 162–175, kap. 22. Oksygeneringssvikt og alveolær hypoventilasjon er forskjellige problemer; bedre SpO₂ under oksygen dokumenterer ikke normalisert ventilasjon. Sammenhold pH/pCO₂ med pustearbeid, bevissthet, grunnsykdom og tidsfestet respons. Lungesykdom, opioider/sedativa og nevromuskulær svikt kan bidra. Akutt og kronisk komponent må skilles klinisk. Frykt, samarbeid og behandlingsmål inngår i vurderingen. Kildens eldre behandlingsdetaljer er ikke automatisk en aktuell norsk prosedyre.",
  },
  {
    id: "fluid-balance",
    title: "Jacobsen mfl.: Væske, elektrolytt og syre-base",
    url: compendium,
    scope:
      "Kompendium s. 118–161, kap. 4. Tolk pH, pCO₂, aktuelt HCO₃⁻/BE sammen med klinikk, elektrolytter, nyrefunksjon, glukose/ketoner og laktat. Skille primær forstyrrelse, kompensasjon og samtidige primære forstyrrelser; nær normal pH kan skjule alvorlig blandet acidose/alkalose. Økt aniongap peker mot blant annet laktat, ketoner, nyresvikt eller toksiske syrer; oppkast/kloridtap kan bidra til alkalose. Tabell 4.4D, trykt s.150, har internt inkonsistente verdier i ORIGINALEN (7,55/1,4/1/−30); disse skal ikke kopieres. Stewart-stoffet merkes fordypning. Korreksjonshastigheter må ha særskilt aktuell kilde.",
  },
  {
    id: "endocrine",
    title: "Endokrinologi, kap. 8, 18 og 38",
    url: compendium,
    scope:
      "Kompendium s. 57–77: DKA, hyperosmolar hyperglykemi, hypoglykemi, primær binyrebarksvikt og hyponatremi/SIADH. Ketoacidose krever vurdering av ketoner og syre-base, ikke glukose alene; SGLT2 kan gi beskjedent glukosenivå. S-kalium ved DKA beskriver ikke kroppens totale kaliumlager. Ved hyperosmolar tilstand er dehydrering/osmolalitet og bevissthet sentralt. Steroidmangel og manglende opptak ved oppkast kan bidra til binyrebarkkrise. Hyponatremi vurderes etter tempo, osmolalitet, volumstatus, nyre/endokrin funksjon og legemidler; SIADH er en eksklusjonsdiagnose. Diagnosegrunnlag og behandlingsprinsipper støttes; eksakte regimer krever aktuell retningslinje.",
  },
  {
    id: "substance",
    title: "Rus, opioidoverdoser og smertebehandling",
    url: compendium,
    scope:
      "Kompendium s. 213–261, 289–311, 348–375 og 464–487. Knytt forgiftnings-/abstinenssymptomer til preparat, formulering, dose, siste inntak og samtidig sykdom. Opioider kan gi CNS- og respirasjonsdepresjon; naloksonrespons avslutter ikke automatisk observasjonsbehov. Alkoholabstinens må skilles fra infeksjon, metabolsk sykdom og andre årsaker til delirium. LAR, toleranse og akutt smerte krever samordnet vurdering, ikke stigmatiserende slutninger. Bevar numerisk medikamenthistorikk. Gjeldende Giftinformasjonen/preparatomtale brukes for presise behandlingsråd.",
  },
  {
    id: "bereavement",
    title: "Dyregrov/Kristensen: Ivaretagelse ved brå død",
    url: compendium,
    scope:
      "Kompendium s. 1–17. Ivareta etterlatte, gi tilpasset informasjon og planlegg videre oppfølging. Barn som pårørende skal tas med i vurderingen.",
  },
  {
    id: "communication",
    title: "Profesjonelle samtaler på tvers av kulturelle skillelinjer",
    url: compendium,
    scope:
      "Kompendium s. 376–399, kap. 11. Utforsk pasientens forståelse, bruk nødvendig språklig bistand og unngå at kulturelle stereotypier erstatter klinisk vurdering.",
  },
  {
    id: "decision-capacity",
    title: "Helsedirektoratet: Pasient- og brukerrettighetsloven § 4-3",
    url: "https://www.helsedirektoratet.no/rundskriv/pasient-og-brukerrettighetsloven-med-kommentarer/samtykke-til-helsehjelp/hvem-som-har-samtykkekompetanse",
    scope:
      "Kontrollert 27.10.2026: beslutningskompetanse vurderes konkret for den aktuelle helsehjelpen; legg til rette for forståelse og dokumenter vurderingen. Diagnose eller uenighet alene avgjør ikke kompetansen. Kilden alene er ikke tilstrekkelig hjemmel for tvang.",
  },
  {
    id: "suicidality",
    title: "Helsedirektoratet: Klinisk vurdering og behandling av suicidalitet",
    url: "https://www.helsedirektoratet.no/retningslinjer/selvmordsforebygging-i-psykisk-helsevern-og-tsb/klinisk-vurdering-og-behandling-av-suicidalitet",
    scope:
      "Kontrollert 27.10.2026. PHV/TSB: individuell klinisk vurdering, allianse, behov for behandling og beskyttelse; revurder ved endringer. Skalaer predikerer ikke selvmord og erstatter ikke vurdering. Ikke grader lav/moderat/høy selvmordsrisiko som fasit.",
  },
  {
    id: "blood-gas-method",
    title: "Radiometer ABL90 FLEX: beregnede syre-base-parametere",
    url: "https://www.ruh.nhs.uk/pathology/documents/poct/SOP_Radiometer_ABL90_Flex_IFU_Instructions.pdf",
    scope:
      "Kontrollert 28.10.2026, kap.11 trykt s.277, ligning 4 og 7. Ved 37 °C, pCO₂ i kPa: aktuelt plasma-HCO₃⁻ = 0,23 × pCO₂ × 10^(pH−6,095). SBE(Ecf) = HCO₃⁻−24,8+16,2×(pH−7,4), mmol/L. Dette er ikke standardbikarbonat eller hemoglobinavhengig BE(B). Støtter beregning og intern datakonsistens; er ikke en algoritme for diagnose, kompensasjon eller behandling.",
  },
  {
    id: "blood-gas-reference",
    title: "Sykehuset Østfold: Syre-basestatus/blodgass",
    url: "https://labfag.no/emne/ckcc7Kac",
    scope:
      "Kontrollert 28.10.2026, faglig oppdatert 07.10.2026. Lokale referanser skiller arterielt og venøst blod og enkelte aldersgrupper. Arteriell pO₂ tolkes med alder/oksygentilførsel; venøs pO₂ er ikke en erstatning. Aktuelt HCO₃⁻ og BE er beregnet og må tolkes med pH/pCO₂; nær normal pH utelukker ikke blandet forstyrrelse. Voksenetablerte pCO₂/HCO₃⁻-intervaller krever medisinsk vurdering hos barn, særlig spedbarn. Aniongap vurderes med albumin. Referanseintervaller er ikke behandlingsmål.",
  },
  {
    id: "sepsis-current",
    title: "Helsedirektoratet: Sepsis, antibiotika i sykehus",
    url: "https://www.helsedirektoratet.no/retningslinjer/antibiotika-i-sykehus/sepsis",
    scope:
      "Kontrollert 28.10.2026. Sepsis innebærer infeksjon med akutt organpåvirkning. Klinisk evaluering, utvikling og organsviktfunn vurderes samlet; qSOFA alene har utilstrekkelig sensitivitet. Relevant mikrobiologisk prøvetaking gjøres uten å forsinke nødvendig behandling. Fokus, tidligere antibiotika/resistens, allergi og nyrefunksjon påvirker valg; ved abdominalt fokus er kildekontroll vesentlig. Definitiv/sannsynlig sepsis: antibiotika raskt og innen 1 time; mulig sepsis uten sjokk: utfyllende vurdering, men innen 3 timer ved vedvarende bakteriell mistanke. Dette er sykehusveiledning, ikke generell regel for alle febrile pasienter. Doseregimer må verifiseres i aktuell fokus-/pasientanbefaling.",
  },
  {
    id: "copd-current",
    title: "Helsedirektoratet: Behandling ved forverringer av kols",
    url: "https://www.helsedirektoratet.no/retningslinjer/kols/behandling-ved-forverringer-av-kols",
    scope:
      "Kontrollert 28.10.2026. Vurder endring fra habituelle symptomer/metning, pustearbeid, våkenhet, komorbiditet og respons på bronkodilatator. Alvorlige symptomer, respirasjonssvikt, manglende respons eller vanskelig hjemmesituasjon støtter sykehusvurdering. Blodgass kan avklare ventilasjon og oksygenering. Bronkodilatasjon, kortikosteroid og antibiotika vurderes etter alvorlighet og tegn til bakteriell infeksjon. Under transport ved alvorlig forverring titreres oksygen mot SpO₂ 88–92 %, med klinisk vurdering. Dette spesifikke intervallet gjelder ikke alle pasientgrupper.",
  },
  {
    id: "troponin",
    title: "Vestre Viken: Troponin T, hjertespesifikk",
    url: "https://metodebok.no/emne/SeKfi2TY/troponin-t--hjertespesifikk/laboratoriebok-%28vvhf%29",
    scope:
      "Kontrollert 28.10.2026. Troponin er markør for myokardskade; en isolert forhøyelse fastslår ikke hjerteinfarkt. Iskemiske symptomer, dynamikk og tolket EKG-/bildeinformasjon må sammenholdes. Hjertesvikt, arytmi, nyresvikt, sepsis, hjerneslag og traume kan også gi stigning. Tidsfestede serielle målinger og oppgitt analysemetode/referanse er nødvendig når utviklingen skal vurderes. Metodespesifikke troponingrenser skal ikke overføres til andre analyser.",
  },
  {
    id: "pulmonary-embolism",
    title: "OUS: Lungeemboli, indremedisinsk metodebok",
    url: "https://metodebok.no/emne/nCgfDyy2/lungeemboli/indremedisin-%28ous%29",
    scope:
      "Kontrollert 28.10.2026, oppdatert 25.06.2025. Lungeemboli kan gi dyspné, pleurittiske smerter, takykardi, synkope eller kollaps. Klinisk sannsynlighet styrer tolkning av D-dimer og behov for CT-pulmonalis; høy mistanke avklares ikke med D-dimer alene. Blodgass kan vise respiratorisk alkalose, og laktat kan stige ved alvorlig sykdom. EKG er uspesifikt; troponin/proBNP og ekko kan belyse høyrebelastning. Lokal OUS-veiledning, ikke grunnlag for ukontrollerte antikoagulasjons- eller trombolysedoser.",
  },
  {
    id: "stroke-current",
    title: "Helsedirektoratet: Hjerneslag, diagnostikk i akuttmottak",
    url: "https://www.helsedirektoratet.no/retningslinjer/hjerneslag/akuttfasen-undersokelse-og-behandling-ved-hjerneslag/diagnostikk-og-behandling-i-akuttmottak",
    scope:
      "Kontrollert 28.10.2026. Avklar debut/sist frisk, glukose, antikoagulasjon og rask klinisk/nevrologisk status inklusive NIHSS. CT og relevant karavbildning inngår i rask diagnostikk. EKG vurderes for iskemi/atrieflimmer. Svelgfunksjon må avklares før peroralt inntak. Relevante differensialer og samtidig infeksjon/hjerteproblem vurderes. Ved overføring gjentas klinisk status og formidles presist. Den konkrete delanbefalingen er sist faglig endret 21.12.2017; den brukes her ikke til å fastsette moderne reperfusjonsvinduer, doser eller kontraindikasjoner.",
  },
  {
    id: "sglt2-current",
    title: "Felleskatalogen: Jardiance (empagliflozin)",
    url: "https://www.felleskatalogen.no/medisin/jardiance-boehringer-ingelheim-590471",
    scope:
      "Kontrollert 28.10.2026. Ketoacidose kan opptre med mindre uttalt glukosestigning. Kvalme, oppkast, magesmerter, rask/dyp pust og redusert våkenhet krever vurdering av ketoner og syre-base uavhengig av glukose. Faste, dehydrering, redusert insulin og alvorlig sykdom/kirurgi øker risikoen. Behandling skal avbrytes ved mistenkt/diagnostisert ketoacidose og revurderes ved alvorlig akutt sykdom. Bevar navn, dose, tidspunkt og indikasjon i medikamenthistorien; gjeldende preparatomtale styrer pasientspesifikke doser og gjenoppstart.",
  },
  {
    id: "pediatric-dka-current",
    title: "Norsk barnelegeforening: Diabetisk ketoacidose",
    url: "https://www.helsebiblioteket.no/innhold/retningslinjer/pediatri/akuttveileder-i-pediatri/2.endokrinologi-metabolisme-og-elektrolyttforstyrrelser/2.2-diabetisk-ketoacidose-dka",
    scope:
      "Kontrollert 28.10.2026, oppdatert 01.06.2026. Pediatrisk DKA vurderes med glukose, ketoner og acidose; pH kan måles venøst. Utredning omfatter vekt, bevissthet, dehydrering, elektrolytter, blodgass og nyrefunksjon. S-kalium kan være høyt til tross for total kaliumdeplesjon og faller under behandling. Væske, insulin, glukose og kalium vurderes samlet. Nevrologisk endring under forløpet krever rask revurdering. Kilden er pediatrisk og skal ikke brukes som voksenprotokoll.",
  },
  {
    id: "ileus-current",
    title: "OUS: Ileus – intestinal obstruksjon",
    url: "https://metodebok.no/emne/VSqbHFV9/ileus-intestinal-obstruksjon/gastrokirurgi-%28ous%29",
    scope:
      "Kontrollert 28.10.2026, oppdatert 25.11.2025. Ved obstruksjonsmistanke avklares mekanisk hinder, nivå og mulig tarmiskemi. Takvise smerter, oppkast, redusert avføring/luft, distensjon og dehydrering er relevante. Tidligere kirurgi, hernie, strålebehandling, inflammatorisk sykdom og motilitetshemmende medisiner inngår i anamnesen. Klinisk undersøkelse og full bildediagnostisk rapport sammenholdes med elektrolytter og organpåvirkning. Normal laktat utelukker ikke tarmiskemi.",
  },
  {
    id: "opioid-current",
    title: "Giftinformasjonen: Morfinforgiftning",
    url: "https://www.helsebiblioteket.no/forgiftninger/legemidler/morfin-behandlingsanbefaling-ved-forgiftning",
    scope:
      "Kontrollert 28.10.2026, revidert 2024. Typiske funn er miose, CNS-depresjon og respirasjonsdepresjon. Frie luftveier og adekvat ventilasjon prioriteres; nalokson vurderes ved CNS-/respirasjonsdepresjon. Vurder samtidig inntak og andre årsaker ved utilstrekkelig respons. Preparat, formulering, administrasjonsvei, dose, tidspunkt og toleranse er nødvendig eksponeringshistorikk. Blodgass, elektrolytter og klinisk overvåking belyser alvorlighet. Respons på antidot betyr ikke at opioidvirkningen er over; observasjonen må ta hensyn til dette. Eksakt dose/observasjonstid krever relevant preparat- og situasjonsvurdering.",
  },
  {
    id: "alcoholic-ketoacidosis",
    title: "Kompendium: Alcoholic ketoacidosis",
    url: "https://drive.google.com/file/d/1g-Wdd3TfFR218yMBjqfwEP6tZVWMeDhk/view",
    scope:
      "Kompendium s.367–375. Alkoholbruk med oppkast og lite næring kan gi ketoacidose med lavt, normalt eller moderat forhøyet glukosenivå. Ketonemi, syre-base, elektrolytter, laktat og klinikk tolkes sammen. Oppkast kan samtidig gi alkalose. Vurder også infeksjon, pankreatitt, annen metabolsk sykdom og toksisk alkohol; ikke forklar all sykdom med alkohol. Kilden støtter diagnostisk resonnement, ernærings-/elektrolyttvurdering og behov for å identifisere samtidige tilstander.",
  },
  {
    id: "ent",
    title: "Kompendium: Øre-nese-hals, munn og svelg",
    url: "https://drive.google.com/file/d/1g-Wdd3TfFR218yMBjqfwEP6tZVWMeDhk/view",
    scope:
      "Kompendium s.78–98. S.95–97 er visuelt lest ØNH, originalbok s.207–209, ikke Markestad. Halsinfeksjon vurderes med allmenntilstand, svelg, luftvei, drikkeevne og relevante tester. Ensidige smerter, trismus og asymmetri støtter abscessmistanke. Mononukleose kan gi systemiske/lymfeknutefunn og luftveisproblem; Lemierre omtales som sjelden alvorlig progresjon. Det danske utdragets doser/antibiotikavarighet skal ikke gjøres til norsk fasit.",
  },
  {
    id: "ent-current",
    title: "Helsedirektoratet: Øvre luftveisinfeksjoner",
    url: "https://www.helsedirektoratet.no/retningslinjer/antibiotika-i-primaerhelsetjenesten/infeksjoner-i-ovre-luftveier",
    scope:
      "Kontrollert 28.10.2026. Streptokokkhalsinfeksjon: klinisk alvorlighet og Strep A vurderes samlet. Positiv test alene betyr ikke antibiotikabehov; mild/moderat GAS-infeksjon og asymptomatisk bærerskap skal ikke automatisk behandles. Antibiotika vurderes ved mer alvorlig sykdom og tilbys ved systemisk påvirkning/risiko eller skarlagensfeber. Centor brukes i voksenpopulasjonen til vurdering av testnytte, ikke som universell barne- eller luftveisfareskår. Behandlingens detaljvalg følger aktuell anbefaling.",
  },
  {
    id: "surgical-stress",
    title: "Kompendium: Smerte, inflammasjon og kirurgisk stress",
    url: "https://drive.google.com/file/d/1g-Wdd3TfFR218yMBjqfwEP6tZVWMeDhk/view",
    scope:
      "Kompendium s.44–56, visuelt lest. Kirurgisk stress knytter inflammasjon, insulinresistens, katabolisme og organbelastning sammen. Postoperative komplikasjoner inkluderer hypoksemi/atelektase/pneumoni, myokardiell belastning, delirium og ileus. Smerte og opioider kan påvirke pust, mobilitet, kvalme, tarm/blære og våkenhet. Vurder lindring sammen med funksjon, ernæring og komplikasjoner; et lavere smerteuttrykk alene viser ikke bedret totalsituasjon. Eldre anestesi-/steroidregimer er ikke verifisert som aktuelle behandlingsråd.",
  },
  {
    id: "cancer-pain",
    title: "Kompendium: Kreftsmerte – behandling",
    url: "https://drive.google.com/file/d/1g-Wdd3TfFR218yMBjqfwEP6tZVWMeDhk/view",
    scope:
      "Kompendium s.489–507, visuelt lest. Skill grunnsmerte/gjennombruddssmerte, nociseptiv/nevropatisk komponent, progresjon, behandlingsbivirkning og uavhengig sykdom. Hyperkalsemi, patologisk brudd og medullakompresjon omtales s.496–499. Opioidbruk må vurderes med nyrefunksjon, sedasjon, obstipasjon og administrasjonsmulighet. Total smerte omfatter fysiske, psykiske, sosiale og eksistensielle forhold; mål inkluderer funksjon og søvn. Mucositt/nevropati kan påvirke ernæring og evnen til å ta medisiner.",
  },
  {
    id: "cord-compression-current",
    title: "Helsedirektoratet: Malign medullakompresjon",
    url: "https://www.helsedirektoratet.no/retningslinjer/palliasjon-i-kreftomsorgen-handlingsprogram/symptomer-og-tilstander/malign-medullakompresjon",
    scope:
      "Kontrollert 28.10.2026. Progredierende ryggsmerte, kraft-/sensibilitetsendring, gangproblem og blære-/tarmsymptomer er sentrale. Full nevrologisk status og MR totalcolumna avklarer mistanke; nevrologiske utfall er øyeblikkelig hjelp. Funksjon før behandling og varighet av utfall påvirker prognose. Kortikosteroider og rask vurdering av kirurgi/stråling inngår ved klinisk mistanke; valg individualiseres med stabilitet, funksjon og behandlingsmål. Ingen automatisk likestilling av kreftdiagnose og behandlingsbegrensning.",
  },
  {
    id: "hypercalcemia-current",
    title: "Helsedirektoratet: Hyperkalsemi ved lungekreft",
    url: "https://www.helsedirektoratet.no/retningslinjer/lungekreft-mesoteliom-og-thymom-handlingsprogram/komplikasjoner-ved-lungekreft-og-oyeblikkelig-hjelp-situasjoner/hyperkalsemi",
    scope:
      "Kontrollert 28.10.2026, faglig endret 19.01.2026. Hyperkalsemi kan ligne generell kreftprogresjon og gi konfusjon, søvnighet, kvalme, polyuri, tørste, obstipasjon og dehydrering. Vurder kalsium med albumin eller ionisert kalsium samt elektrolytter og nyrefunksjon. Den kan forekomme uten kjente skjelettmetastaser. Rehydrering og kalsiumsenkende behandling inngår, tilpasset pasientens organfunksjon; ved vedvarende CNS-symptomer vurderes andre årsaker. Kilden gjelder kreftkomplikasjon, ikke en generell protokoll for alle årsaker til hyperkalsemi.",
  },
  {
    id: "liaison-psychiatry",
    title: "Kompendium: Konsultasjons-/liaisonpsykiatri",
    url: "https://drive.google.com/file/d/1g-Wdd3TfFR218yMBjqfwEP6tZVWMeDhk/view",
    scope:
      "Kompendium s.400–463. Somatisk sykdom og psykiske symptomer påvirker hverandre. Akutt endring i oppmerksomhet, kognisjon eller atferd krever vurdering av delirium, hypoksi, infeksjon, metabolsk sykdom og legemidler/rus. En psykiatrisk diagnose fritar ikke fra somatisk undersøkelse. Pasientens opplevelse, allianse og formidling er del av klinisk vurdering.",
  },
  {
    id: "pain",
    title: "Kompendium: Smertevurdering og sykepleie",
    url: "https://drive.google.com/file/d/1g-Wdd3TfFR218yMBjqfwEP6tZVWMeDhk/view",
    scope:
      "Kompendium s.18–42 og 464–487. Smerte kartlegges med pasientens beskrivelse og tilpasset observasjon, funksjon, forløp og respons. Barn trenger alders- og utviklingstilpasset vurdering. Medikamentell og ikke-medikamentell lindring vurderes med bivirkninger, respirasjon og våkenhet. Manglende synlige tegn utelukker ikke smerte; tidligere rusbruk gjør ikke smerte mindre reell.",
  },
  {
    id: "violence",
    title: "Kompendium: Vold i akuttmottak",
    url: "https://drive.google.com/file/d/1g-Wdd3TfFR218yMBjqfwEP6tZVWMeDhk/view",
    scope:
      "Kompendium s.190–200 sammenholdt med Arbeidskrav 1. Vold berører klinisk skade, trygghet, relasjon og organisering. Vurder pasientens egen historie, skader, videre sikkerhet og støtte. Deeskalering og tydelig kommunikasjon må ikke erstatte undersøkelse av somatisk sykdom. Lovpåstander, deling uten samtykke eller tvang krever en særskilt relevant hjemmel; denne artikkelen er ikke lovgrunnlag.",
  },
];
export function sourcesFor(ids: readonly string[]) {
  return SOURCES.filter((s) => ids.includes(s.id));
}
export function sourceContext(ids: readonly string[]) {
  const policy =
    "Kildene har ulike roller: studiehefte/eksamenseksempler avgrenser læringsmål og nivå; fagkilder støtter resonnement. Numeriske doser i pasientens eksisterende medikament- eller eksponeringshistorikk beholdes. Nye presise behandlingsdoser, hastigheter og rettslige påstander må støttes eksplisitt av aktuell pasient-/settingrelevant kilde; ingen generell doseforbud. Kompendiefeil eller gammel praksis skal ikke bli fasit.";
  return (
    policy +
    "\n" +
    sourcesFor(ids)
      .map((s) => `${s.id}: ${s.title}. ${s.scope}`)
      .join("\n")
  );
}
