import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  HeartPulse,
  Menu,
  Mic,
  Pause,
  Stethoscope,
  Thermometer,
  UserRound,
  Volume2,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import emergencyDepartment from "@/assets/emergency-department.jpg";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAKS790 — Clinical Reasoning Exam" },
      {
        name: "description",
        content: "Train clinical reasoning through realistic long-form acute medicine cases.",
      },
      { property: "og:title", content: "MAKS790 — Clinical Reasoning Exam" },
      {
        property: "og:description",
        content: "Train clinical reasoning through realistic long-form acute medicine cases.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const stages = [
  "Presentation",
  "Initial assessment",
  "Investigations",
  "Differential diagnosis",
  "Management",
  "Reflection",
];

const caseSections = [
  {
    title: "Current findings",
    icon: Stethoscope,
    content: (
      <ul className="space-y-2 text-sm leading-6 text-foreground/80">
        <li>• Tachypnoeic, using accessory muscles</li>
        <li>• Reduced breath sounds at the right base</li>
        <li>• Fine bilateral inspiratory crepitations</li>
        <li>• Cool peripheries, capillary refill 3 seconds</li>
        <li>• Irregularly irregular pulse</li>
      </ul>
    ),
  },
  {
    title: "Available investigations",
    icon: ClipboardList,
    content: (
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-foreground/80">
        <span>ECG</span><span>Chest radiograph</span><span>Venous gas</span><span>Full blood count</span>
      </div>
    ),
  },
  {
    title: "Your task",
    icon: Brain,
    content: (
      <p className="text-sm leading-6 text-foreground/80">
        Explain your immediate assessment, the most likely causes of deterioration, and your first three management priorities.
      </p>
    ),
  },
];

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Kunne ikke lese lydopptaket."));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

function Index() {
  const [screen, setScreen] = useState<"landing" | "exam">("landing");

  if (screen === "exam") {
    return <ExamWorkspace onExit={() => setScreen("landing")} />;
  }

  return <Landing onStart={() => setScreen("exam")} />;
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="brand-pulse relative h-8 w-12 shrink-0" aria-hidden="true">
        <svg viewBox="0 0 48 30" className="h-full w-full fill-none stroke-primary" strokeWidth="1.8">
          <path d="M1 16h10l3-10 5 22 5-27 5 22 4-7h14" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="truncate text-base font-bold leading-none text-foreground sm:text-xl">MAKS790</div>
        <div className="mt-1 truncate text-[10px] text-muted-foreground sm:text-xs">Akuttmedisin</div>
      </div>
    </div>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="landing-shell relative isolate min-h-dvh overflow-hidden bg-background text-foreground lg:h-dvh lg:min-h-0 lg:border lg:border-foreground/25 lg:rounded-[1.25rem]">
      <img
        src={emergencyDepartment}
        alt="Emergency department prepared for an acute care simulation"
        width={1920}
        height={1080}
        className="absolute inset-0 -z-30 h-full w-full object-cover object-[62%_center]"
      />
      <div className="landing-shade absolute inset-0 -z-20" />

      <header className="relative z-40 mx-auto grid w-full max-w-[1680px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-14 lg:py-7">
        <Brand />
        <nav className="hidden items-center gap-12 text-sm text-foreground/80 lg:flex" aria-label="Hovedmeny">
          <a className="story-link" href="#om">Om</a>
          <a className="story-link" href="#fagomrader">Fagområder</a>
          <a className="story-link" href="#slik-fungerer-det">Slik fungerer det</a>
          <a className="story-link" href="#faq">FAQ</a>
        </nav>
        <div className="flex shrink-0 justify-self-end items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex" aria-label="Åpne profil">
            <UserRound className="size-6" strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} aria-label="Åpne meny">
            <Menu className="size-7" strokeWidth={1.5} />
          </Button>
        </div>
      </header>

      {menuOpen && (
        <div className="menu-overlay fixed inset-0 z-50 flex flex-col bg-background/97 px-6 py-5 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <Brand />
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} aria-label="Lukk meny"><X /></Button>
          </div>
          <nav className="my-auto flex flex-col items-center gap-7 text-2xl" aria-label="Mobilmeny">
            {['Om', 'Fagområder', 'Slik fungerer det', 'FAQ', 'Profil'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setMenuOpen(false)}>{item}</a>
            ))}
          </nav>
        </div>
      )}

      <section className="hero-content mx-auto grid w-full max-w-[1680px] px-5 pb-10 sm:px-8 lg:grid-cols-[minmax(260px,.8fr)_minmax(500px,1.4fr)_minmax(200px,.6fr)] lg:px-14">
        <div className="hero-copy order-2 self-center pt-12 lg:order-1 lg:pt-20">
          <h1 className="hero-title font-semibold leading-[1.03]">
            Øv som<br />på eksamen
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-foreground/82 sm:text-base">
            Reelle situasjoner. Tydelig tilbakemelding.<br />Bedre beslutninger.
          </p>
          <div className="mt-7 h-1 w-11 bg-primary" />
          <div className="technical-label mt-5">Akuttmedisin gjør en forskjell</div>
        </div>

        <div className="orbit-navigation order-1 relative flex min-w-0 flex-col items-center lg:order-2">
          <OrbitButton icon={Brain} title={<>Start<br />eksamen</>} variant="primary" onClick={onStart} />

          <div className="orbit-connectors" aria-hidden="true">
            <svg viewBox="0 0 520 120" preserveAspectRatio="none">
              <path d="M260 0 C260 52 180 22 150 82 C134 112 102 116 70 116" />
              <path d="M260 0 C260 52 340 22 370 82 C386 112 418 116 450 116" />
              <circle cx="70" cy="116" r="3" />
              <circle cx="450" cy="116" r="3" />
            </svg>
          </div>

          <div className="practice-branch relative z-10 grid w-full max-w-[480px] grid-cols-2 gap-3 sm:gap-10">
            <ModeButton icon={Zap} title={<>Kort<br />repetisjon</>} detail={<>Få opp de viktigste<br />prinsippene</>} time="10–15 min" onClick={onStart} />
            <ModeButton icon={BookOpen} title={<>Lang<br />repetisjon</>} detail={<>Gå dypere, systematisk<br />gjennom fagområder</>} time="30–60 min" onClick={onStart} />
          </div>
        </div>

        <div className="philosophy-copy order-3 hidden self-center justify-self-end lg:block">
          <div className="space-y-5 text-[11px] uppercase text-foreground/75">
            {['Kunnskap', 'Vurdering', 'Handlingskraft'].map((item) => (
              <div key={item} className="philosophy-line flex items-center gap-5"><span />{item}</div>
            ))}
          </div>
        </div>

        <div className="order-3 mt-10 text-center lg:hidden">
          <p className="text-2xl font-semibold leading-tight sm:text-3xl">Øv som på eksamen</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-foreground/72">Reelle situasjoner. Tydelig tilbakemelding. Bedre beslutninger.</p>
          <div className="technical-label mt-5">Akuttmedisin gjør en forskjell</div>
        </div>
      </section>
    </main>
  );
}

function OrbitButton({ icon: Icon, title, variant, onClick }: { icon: typeof Brain; title: ReactNode; variant: "primary"; onClick: () => void }) {
  return (
    <Button type="button" variant="bare" size="free" onClick={onClick} className={`exam-orbit ${variant} group relative z-20 grid place-items-center rounded-full text-foreground`} aria-label="Start eksamen">
      <span className="orbit-ring orbit-ring-outer" />
      <span className="orbit-ring orbit-ring-middle" />
      <span className="orbit-ring orbit-ring-inner" />
      <span className="relative flex flex-col items-center">
        <Icon className="mb-3 size-11 text-foreground/80" strokeWidth={1.15} />
        <span className="text-2xl font-semibold leading-tight sm:text-3xl">{title}</span>
        <span className="mt-4 grid size-11 place-items-center rounded-full bg-foreground text-background transition-transform duration-300 group-hover:translate-x-1">
          <ArrowRight className="size-5" />
        </span>
      </span>
    </Button>
  );
}

function ModeButton({ icon: Icon, title, detail, time, onClick }: { icon: typeof Brain; title: ReactNode; detail: ReactNode; time: string; onClick: () => void }) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <Button type="button" variant="bare" size="free" onClick={onClick} className="mode-button group flex aspect-square w-full max-w-[145px] min-w-0 flex-col whitespace-normal border border-border bg-background/60 px-3 text-center backdrop-blur-md sm:max-w-[175px]">
        <Icon className="mx-auto size-7 text-secondary transition-transform group-hover:-translate-y-0.5" strokeWidth={1.5} />
        <span className="mt-2 block text-base font-semibold leading-5 sm:text-lg">{title}</span>
        <span className="mt-2 block text-[9px] leading-4 text-muted-foreground sm:text-[10px]">{detail}</span>
      </Button>
      <span className="technical-label mt-4 block">{time}</span>
    </div>
  );
}

function ExamWorkspace({ onExit }: { onExit: () => void }) {
  const [stage, setStage] = useState(0);
  const [answer, setAnswer] = useState("");
  const [openSection, setOpenSection] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const transcribe = useServerFn(transcribeAudio);

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const toggleListening = async () => {
    if (listening) {
      recorderRef.current?.stop();
      setListening(false);
      return;
    }

    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setSpeechMessage("Diktering støttes ikke i denne nettleseren. Du kan skrive svaret ditt.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (blob.size === 0) return;
        setTranscribing(true);
        try {
          const base64 = await blobToBase64(blob);
          const result = await transcribe({
            data: { audio: base64, mimeType: blob.type, languageCode: "nor" },
          });
          const text = result.text.trim();
          if (text) setAnswer((current) => `${current}${current ? " " : ""}${text}`);
          else setSpeechMessage("Fikk ikke med noe lyd. Prøv igjen.");
        } catch {
          setSpeechMessage("Transkriberingen feilet. Prøv igjen eller skriv svaret.");
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setSpeechMessage("");
      setListening(true);
    } catch {
      setSpeechMessage("Fikk ikke tilgang til mikrofonen. Sjekk tillatelser i nettleseren.");
    }
  };

  const next = () => setStage((value) => Math.min(value + 1, stages.length - 1));
  const back = () => stage === 0 ? onExit() : setStage((value) => value - 1);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-7">
          <Brand />
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium">Case 3 av 6</div>
              <div className="text-[10px] text-muted-foreground">Akuttmedisin</div>
            </div>
            <Button variant="ghost" size="icon" onClick={onExit} aria-label="Close case"><X /></Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 pb-4 sm:px-7">
          <span className="text-xs text-muted-foreground">Case 3 av 6</span>
          <div className="grid flex-1 grid-cols-6 gap-1.5">
            {stages.map((item, index) => (
              <Button key={item} type="button" variant="bare" size="free" onClick={() => setStage(index)} aria-label={item} className={`h-1 w-full rounded-full transition-colors ${index <= stage ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <span className="technical-label hidden sm:block">{stages[stage]}</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-0 lg:grid-cols-[minmax(0,1.12fr)_minmax(370px,0.88fr)]">
        <section className="min-w-0 px-4 py-4 sm:px-7 sm:py-6 lg:border-r lg:border-border/70 lg:px-10 lg:py-9">
          <div className="mb-5 flex items-start justify-between gap-4 sm:mb-7">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs text-secondary"><Activity className="size-4" /> Case presentation</div>
              <h1 className="text-2xl font-semibold sm:text-3xl">Akutt pustevansker</h1>
              <p className="mt-1 text-sm text-muted-foreground">68 år gammel mann</p>
            </div>
            <span className="shrink-0 rounded-full border border-primary/45 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary">Indremedisin</span>
          </div>

          <div className="patient-story relative border border-border bg-card p-4 sm:p-6">
            <div className="absolute left-0 top-5 h-10 w-px bg-secondary" />
            <p className="text-xs leading-5 text-foreground/82 sm:text-base sm:leading-7">
              En 68 år gammel mann kommer til legevakt med akutt oppstått pustevansker de siste to timene. Han er urolig, svett og klager på trykk i brystet. Tidligere kjent med hypertensjon og atrieflimmer. Fast medikasjon: apiksaban, metoprolol og atorvastatin.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between sm:mt-7">
            <div className="flex items-center gap-2"><HeartPulse className="size-5 text-primary" /><h2 className="text-sm font-semibold">Vitalparametere</h2></div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />09:32</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Vital icon={HeartPulse} label="Heart rate" value="128" unit="/min" tone="critical" />
            <Vital icon={Activity} label="Blood pressure" value="85/60" unit="mmHg" tone="critical" />
            <Vital icon={Wind} label="Respiratory rate" value="28" unit="/min" tone="warm" />
            <Vital icon={Volume2} label="SpO₂" value="88" unit="%" tone="critical" />
            <Vital icon={Thermometer} label="Temperature" value="37.8" unit="°C" tone="warm" />
            <Vital icon={Brain} label="Consciousness" value="Alert" unit="GCS 15" tone="calm" />
          </div>

          <div className="mt-7 space-y-2">
            {caseSections.map((section, index) => {
              const Icon = section.icon;
              const open = openSection === index;
              return (
                <div key={section.title} className="overflow-hidden border border-border bg-card">
                  <Button type="button" variant="bare" size="free" onClick={() => setOpenSection(open ? -1 : index)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left">
                    <Icon className="size-4 shrink-0 text-secondary" />
                    <span className="truncate text-sm font-semibold">{section.title}</span>
                    <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                  </Button>
                  {open && <div className="border-t border-border px-4 py-4 animate-reveal">{section.content}</div>}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="min-w-0 border-t border-border/70 bg-panel px-4 py-6 sm:px-7 lg:sticky lg:top-[113px] lg:h-[calc(100dvh-113px)] lg:border-t-0 lg:px-8 lg:py-9">
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="technical-label text-secondary">Your response</div>
                <h2 className="mt-2 text-xl font-semibold">What would you do next?</h2>
              </div>
              <Button variant={listening ? "default" : "outline"} size="icon" onClick={toggleListening} aria-label={listening ? "Stop voice input" : "Start voice input"} title={listening ? "Stop voice input" : "Start voice input"}>
                {listening ? <Pause /> : <Mic />}
              </Button>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Talk through your reasoning as you would in the exam, or type your answer.
            </p>

            {listening && (
              <div className="mt-4 flex items-center gap-3 border border-primary/40 bg-primary/8 px-4 py-3 text-xs text-primary">
                <span className="recording-dot size-2 rounded-full bg-primary" /> Listening… speak naturally
              </div>
            )}
            {speechMessage && <p className="mt-3 text-xs leading-5 text-secondary">{speechMessage}</p>}

            <div className="relative mt-5 flex-1">
              <Textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Begin with your immediate priorities…"
                className="min-h-72 h-full resize-none border-border bg-background/55 p-4 text-base leading-7 focus-visible:ring-primary lg:min-h-0"
              />
              <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground">{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</span>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <Button variant="outline" size="lg" onClick={back} className="min-w-0 flex-1"><ArrowLeft />Back</Button>
              <Button size="lg" onClick={next} className="min-w-0 flex-1">{stage === stages.length - 1 ? "Finish" : "Next"}<ArrowRight /></Button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Vital({ icon: Icon, label, value, unit, tone }: { icon: typeof Activity; label: string; value: string; unit: string; tone: "critical" | "warm" | "calm" }) {
  const toneClass = tone === "critical" ? "text-primary" : tone === "warm" ? "text-secondary" : "text-success";
  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-2 border border-border bg-card p-2.5 sm:gap-3 sm:p-3">
      <Icon className={`mt-1 size-5 shrink-0 ${toneClass}`} strokeWidth={1.6} />
      <div className="min-w-0">
        <div className="truncate text-[10px] text-muted-foreground">{label}</div>
        <div className="mt-0.5 truncate text-base font-semibold leading-none sm:text-lg">{value}</div>
        <div className="mt-1 text-[9px] text-muted-foreground">{unit}</div>
      </div>
    </div>
  );
}
