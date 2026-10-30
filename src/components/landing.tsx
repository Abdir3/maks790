import { ArrowRight, BookOpen, Brain, Menu, UserRound, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import "./landing.css";
import emergencyDepartment from "@/assets/emergency-department.webp";
import emergencyDepartmentMobile from "@/assets/emergency-department-mobile.webp";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const information = {
  om: {
    label: "Om",
    title: "Tryggere i møtet med det akutte",
    description: "MAKS790 er et øvingsrom for klinisk resonnering i akuttmedisin.",
    body: "Arbeid med pasienthistorier, vurder vitalparametere og sett ord på prioriteringene dine. Øv på å forklare hva du vil gjøre, og hvorfor, slik du ville gjort på eksamen.",
  },
  fagomrader: {
    label: "Fagområder",
    title: "Akuttmedisin, steg for steg",
    description: "Øv med faste caser eller lag nye innen pensumets fagområder.",
    body: "Utforsk pasienthistorien, kliniske funn og tilgjengelige undersøkelser. Arbeid videre med differensialdiagnoser, behandling og refleksjon.",
  },
  "slik-fungerer-det": {
    label: "Slik fungerer det",
    title: "Les. Vurder. Forklar.",
    description: "Velg en case og arbeid med oppgavene i eget tempo.",
    body: "Hele casen og alle oppgavene er tilgjengelige fra starten. Les situasjonen, vurder funnene og begrunn valgene dine. På nye caser kan du skrive eller diktere egne svar og få samlet tilbakemelding, eller åpne et begrunnet løsningsforslag. Du kan bearbeide svarene etter tilbakemeldingen. Øvingen gir ingen karakter.",
  },
  faq: {
    label: "FAQ",
    title: "Før du begynner",
    description: "Prøv et åpent eksempel i casebiblioteket uten konto.",
    body: "De åpne eksemplene har oppgaver og lokal kladd, men ingen KI-tilbakemelding eller løsningsforslag. Logg inn for å lage nye caser med begge deler. Svarutkast lagres bare på denne enheten og synkroniseres ikke mellom enheter. Diktering krever mikrofontilgang og en tilgjengelig transkriberingstjeneste. Øvingen er ikke offisiell eksamen eller sensur.",
  },
} as const;

type InformationKey = keyof typeof information;
const navigation: InformationKey[] = ["om", "fagomrader", "slik-fungerer-det", "faq"];

export function Brand() {
  return (
    <div className="maks-brand">
      <svg viewBox="0 0 80 52" className="brand-pulse" fill="none" aria-hidden="true">
        <defs>
          <linearGradient
            id="maks-pulse"
            x1="0"
            y1="52"
            x2="0"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ff565f" />
            <stop offset=".55" stopColor="#ff7b72" />
            <stop offset="1" stopColor="#fff2e6" />
          </linearGradient>
        </defs>
        <path
          d="M1 29h26l5-7 6 11 8-31 4 47 9-26 5 6h15"
          stroke="url(#maks-pulse)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="brand-wordmark">
        <strong>MAKS790</strong>
        <span>Akuttmedisin</span>
      </div>
    </div>
  );
}

export function Landing({
  onStart,
  onQuick,
  onLibrary,
  onLogin,
  onLogout,
  authReady,
  signedIn,
  userEmail,
  signingOut,
  accountError,
}: {
  onStart: () => void;
  onQuick: () => void;
  onLibrary: () => void;
  onLogin: () => void;
  onLogout: () => Promise<boolean>;
  authReady: boolean;
  signedIn: boolean;
  userEmail: string | null;
  signingOut: boolean;
  accountError: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeInformation, setActiveInformation] = useState<InformationKey | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const selected = activeInformation ? information[activeInformation] : null;

  return (
    <main className="landing-shell">
      <a className="landing-skip-link" href="#start-eksamen">
        Gå til øvingen
      </a>
      <picture className="landing-background" aria-hidden="true">
        <source media="(max-width: 600px)" srcSet={emergencyDepartmentMobile} />
        <img
          src={emergencyDepartment}
          alt=""
          width={1672}
          height={941}
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div className="landing-shade" aria-hidden="true" />
      <div className="landing-atmosphere" aria-hidden="true" />

      <header className="landing-header">
        <Brand />
        <nav className="landing-nav" aria-label="Hovedmeny">
          <button type="button" className="story-link" onClick={onLibrary}>
            Casebibliotek
          </button>
          {navigation
            .filter((key) => key !== "faq")
            .map((key) => (
              <button
                type="button"
                className="story-link"
                key={key}
                onClick={() => setActiveInformation(key)}
              >
                {information[key].label}
              </button>
            ))}
        </nav>
        <div className="landing-header-actions">
          <Button
            variant="ghost"
            className="min-h-11 px-2 text-inherit hover:bg-white/10 hover:text-white"
            disabled={!authReady || signingOut}
            onClick={() => (signedIn ? setAccountOpen(true) : onLogin())}
          >
            <UserRound strokeWidth={1.4} aria-hidden="true" />
            {!authReady ? "Venter …" : signedIn ? "Konto" : "Logg inn"}
          </Button>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="landing-icon-button"
                aria-label="Åpne meny"
              >
                <Menu strokeWidth={1.4} />
              </Button>
            </SheetTrigger>
            <SheetContent className="landing-menu">
              <SheetHeader>
                <SheetTitle>MAKS790</SheetTitle>
                <SheetDescription>Akuttmedisin</SheetDescription>
              </SheetHeader>
              <nav aria-label="Utvidet meny" className="landing-menu-links">
                {navigation.map((key) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => {
                      setMenuOpen(false);
                      setActiveInformation(key);
                    }}
                  >
                    {information[key].label}
                    <ArrowRight aria-hidden="true" />
                  </button>
                ))}
              </nav>
              <Button
                variant="outline"
                onClick={() => {
                  setMenuOpen(false);
                  onLibrary();
                }}
                className="w-full"
              >
                Casebibliotek
              </Button>
              <Button
                disabled={!authReady || signingOut}
                onClick={() => {
                  setMenuOpen(false);
                  onQuick();
                }}
                className="w-full"
              >
                Kort klinisk case
              </Button>
              <Button
                disabled={!authReady || signingOut}
                onClick={() => {
                  setMenuOpen(false);
                  onStart();
                }}
                className="w-full"
                variant="outline"
              >
                Lang eksamensøving
              </Button>
              <Button
                disabled={!authReady || signingOut}
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setMenuOpen(false);
                  if (signedIn) setAccountOpen(true);
                  else onLogin();
                }}
              >
                {signedIn ? "Konto og utlogging" : "Logg inn"}
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <section className="hero-content" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title" className="hero-title">
            Øv som <br />
            på eksamen
          </h1>
          <p className="hero-description">
            Korte kliniske vurderinger.
            <br />
            Lange, helhetlige eksamenscaser.
          </p>
          <div className="hero-divider" aria-hidden="true" />
          <p className="hero-signature">Akuttmedisin gjør en forskjell</p>
        </div>

        <div className="orbit-navigation" aria-label="Velg øving">
          <Button
            id="start-eksamen"
            type="button"
            variant="bare"
            size="free"
            onClick={onStart}
            disabled={!authReady || signingOut}
            className="exam-orbit"
            aria-label="Lang eksamensøving — 3–6 deler, bred kasuistikk på eksamensnivå"
          >
            <span className="orbit-ring orbit-ring-outer" aria-hidden="true" />
            <span className="orbit-ring orbit-ring-middle" aria-hidden="true" />
            <span className="orbit-ring orbit-ring-inner" aria-hidden="true" />
            <span className="orbit-flare orbit-flare-top" aria-hidden="true" />
            <span className="orbit-flare orbit-flare-bottom" aria-hidden="true" />
            <span className="exam-orbit-content">
              <Brain className="exam-brain" strokeWidth={0.9} aria-hidden="true" />
              <span className="exam-orbit-title">
                <span className="long-title-compact">
                  Lang
                  <br />
                  case
                </span>
                <span className="long-title-mobile">Lang eksamensøving</span>
              </span>
              <span className="long-mode-description">3–6 deler · eksamensnivå</span>
              <span className="exam-arrow">
                <ArrowRight strokeWidth={2} aria-hidden="true" />
              </span>
            </span>
          </Button>

          <div className="orbit-connectors" aria-hidden="true">
            <svg viewBox="0 0 480 260" fill="none">
              <defs>
                <linearGradient
                  id="branch-light"
                  x1="240"
                  y1="0"
                  x2="240"
                  y2="260"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#ffb980" />
                  <stop offset=".5" stopColor="#eaa28b" />
                  <stop offset="1" stopColor="#da6d67" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M191 8C141 8 144 45 113 45C42 45 3 88 3 167V245M289 8C339 8 336 45 367 45C438 45 477 88 477 167V245"
                stroke="url(#branch-light)"
              />
            </svg>
            <span className="branch-spark branch-spark-left" />
            <span className="branch-spark branch-spark-right" />
          </div>

          <div className="practice-branch">
            <ModeButton
              icon={Zap}
              title="Kort klinisk case"
              detail="Tolk funn og begrunn vurderingene dine"
              time="2–3 spørsmål"
              onClick={onQuick}
              disabled={!authReady || signingOut}
            />
            <ModeButton
              icon={BookOpen}
              title="Casebibliotek"
              detail="Fortsett en case eller prøv et åpent eksempel"
              time="Eksempler uten innlogging"
              mobileMetadata="Se et eksempel uten å logge inn"
              onClick={onLibrary}
            />
          </div>
        </div>

        <div className="philosophy-copy" aria-label="Kunnskap, vurdering og handlingskraft">
          {["Kunnskap", "Vurdering", "Handlingskraft"].map((item) => (
            <div key={item} className="philosophy-line">
              <span aria-hidden="true" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setActiveInformation(null);
        }}
      >
        <DialogContent className="landing-information">
          {selected && (
            <>
              <DialogHeader>
                <p className="information-eyebrow">MAKS790 / {selected.label}</p>
                <DialogTitle className="text-2xl leading-tight">{selected.title}</DialogTitle>
                <DialogDescription className="pt-3 text-base leading-relaxed">
                  {selected.description}
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-7 text-foreground/80">{selected.body}</p>
              <Button
                className="mt-3 justify-self-start"
                onClick={() => {
                  setActiveInformation(null);
                  onLibrary();
                }}
              >
                Åpne casebiblioteket
                <ArrowRight aria-hidden="true" />
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="landing-information">
          <DialogHeader>
            <DialogTitle>Kontoen din</DialogTitle>
            <DialogDescription className="break-all">
              {userEmail ?? "Du er logget inn."}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-6 text-muted-foreground">
            De genererte casene dine følger kontoen. Svarutkast lagres bare på denne enheten og
            synkroniseres ikke mellom enheter. Utlogging fjerner ikke lokale svarutkast.
          </p>
          {accountError && (
            <p role="alert" className="text-sm text-destructive">
              {accountError}
            </p>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setAccountOpen(false);
              onLibrary();
            }}
          >
            Åpne casebiblioteket
          </Button>
          <Button
            disabled={signingOut}
            onClick={() =>
              void onLogout().then((success) => {
                if (success) setAccountOpen(false);
              })
            }
          >
            {signingOut ? "Logger ut …" : "Logg ut på denne enheten"}
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ModeButton({
  icon: Icon,
  title,
  detail,
  time,
  mobileMetadata = time,
  onClick,
  disabled = false,
}: {
  icon: typeof Brain;
  title: ReactNode;
  detail: ReactNode;
  time: string;
  mobileMetadata?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="practice-mode">
      <Button
        type="button"
        variant="bare"
        size="free"
        onClick={onClick}
        disabled={disabled}
        className="mode-button"
      >
        <Icon className="mode-icon" strokeWidth={1.3} aria-hidden="true" />
        <span className="mode-title">{title}</span>
        <span className="mode-description">{detail}</span>
        <span className="mode-mobile-metadata">{mobileMetadata}</span>
        <span className="mode-arrow">
          <ArrowRight aria-hidden="true" />
        </span>
      </Button>
      <span className="mode-duration">{time}</span>
    </div>
  );
}
