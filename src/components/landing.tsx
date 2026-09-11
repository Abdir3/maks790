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
    description: "Den tilgjengelige øvingscasen handler om akutte pustevansker.",
    body: "Utforsk pasienthistorien, kliniske funn og tilgjengelige undersøkelser. Arbeid videre med differensialdiagnoser, behandling og refleksjon.",
  },
  "slik-fungerer-det": {
    label: "Slik fungerer det",
    title: "Les. Vurder. Forklar.",
    description: "Start en case og jobb deg gjennom de seks trinnene i eget tempo.",
    body: "Les presentasjonen og vitalparameterne. Skriv resonnementet ditt, eller bruk mikrofonen til å diktere når diktering er tilgjengelig. Du kan gå frem og tilbake mellom trinnene mens du øver.",
  },
  faq: {
    label: "FAQ",
    title: "Før du begynner",
    description: "Du kan starte øvingscasen uten å opprette en konto.",
    body: "De tre øvingsknappene åpner foreløpig den samme casen. Tidsangivelsene er forslag til hvor lenge du kan øve. Svar lagres ikke når du avslutter casen. Diktering krever mikrofontilgang og en tilgjengelig transkriberingstjeneste.",
  },
  profil: {
    label: "Profil",
    title: "Øv uten innlogging",
    description: "Øvingscasen er åpen og klar til bruk.",
    body: "Personlig profil og lagring av fremgang er ikke tilgjengelig ennå. Du kan likevel starte en case og øve i ditt eget tempo.",
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

export function Landing({ onStart }: { onStart: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeInformation, setActiveInformation] = useState<InformationKey | null>(null);
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
          {navigation.map((key) => (
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
            size="icon"
            className="landing-icon-button"
            onClick={() => setActiveInformation("profil")}
            aria-label="Åpne profil"
          >
            <UserRound strokeWidth={1.4} />
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
                {[...navigation, "profil" as const].map((key) => (
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
              <Button onClick={onStart} className="w-full">
                Start eksamen
                <ArrowRight aria-hidden="true" />
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <section className="hero-content" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title" className="hero-title">
            Øv som
            <br />
            på eksamen
          </h1>
          <p className="hero-description">
            Reelle situasjoner. Tydelig tilbakemelding.
            <br />
            Bedre beslutninger.
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
            className="exam-orbit"
            aria-label="Start eksamen"
          >
            <span className="orbit-ring orbit-ring-outer" aria-hidden="true" />
            <span className="orbit-ring orbit-ring-middle" aria-hidden="true" />
            <span className="orbit-ring orbit-ring-inner" aria-hidden="true" />
            <span className="orbit-flare orbit-flare-top" aria-hidden="true" />
            <span className="orbit-flare orbit-flare-bottom" aria-hidden="true" />
            <span className="exam-orbit-content">
              <Brain className="exam-brain" strokeWidth={0.9} aria-hidden="true" />
              <span className="exam-orbit-title">
                Start
                <br />
                eksamen
              </span>
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
              title={
                <>
                  Kort
                  <br />
                  repetisjon
                </>
              }
              detail={
                <>
                  Få opp de viktigste
                  <br />
                  prinsippene
                </>
              }
              time="10–15 min"
              onClick={onStart}
            />
            <ModeButton
              icon={BookOpen}
              title={
                <>
                  Lang
                  <br />
                  repetisjon
                </>
              }
              detail={
                <>
                  Gå dypere, systematisk
                  <br />
                  gjennom fagområder
                </>
              }
              time="30–60 min"
              onClick={onStart}
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
              <Button className="mt-3 justify-self-start" onClick={onStart}>
                Start eksamen
                <ArrowRight aria-hidden="true" />
              </Button>
            </>
          )}
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
  onClick,
}: {
  icon: typeof Brain;
  title: ReactNode;
  detail: ReactNode;
  time: string;
  onClick: () => void;
}) {
  return (
    <div className="practice-mode">
      <Button type="button" variant="bare" size="free" onClick={onClick} className="mode-button">
        <Icon className="mode-icon" strokeWidth={1.3} aria-hidden="true" />
        <span className="mode-title">{title}</span>
        <span className="mode-description">{detail}</span>
      </Button>
      <span className="mode-duration">{time}</span>
    </div>
  );
}
