import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Brain,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  HeartPulse,
  Lightbulb,
  Menu,
  Mic,
  MonitorSmartphone,
  Pause,
  Play,
  Stethoscope,
  Thermometer,
  Users,
  Volume2,
  Wind,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<{ 0: { transcript: string } }>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

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
        <div className="truncate text-sm font-bold leading-none text-foreground sm:text-base">MAKS790</div>
        <div className="mt-1 truncate text-[10px] text-muted-foreground sm:text-xs">Acute medicine</div>
      </div>
    </div>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <main className="landing-shell relative isolate min-h-dvh overflow-hidden bg-background text-foreground">
      <img
        src={emergencyDepartment}
        alt="Emergency department prepared for an acute care simulation"
        width={1920}
        height={1080}
        className="absolute inset-0 -z-30 h-full w-full object-cover object-[64%_center]"
      />
      <div className="landing-shade absolute inset-0 -z-20" />
      <div className="clinical-grid absolute inset-0 -z-10 opacity-20" />

      <header className="mx-auto grid w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 sm:px-10 lg:px-14 lg:py-8">
        <Brand />
        <div className="hidden items-center gap-8 md:flex">
          <span className="technical-label">Think. Prioritise. Act.</span>
          <span className="text-xs text-foreground/70">As in real life. Only better.</span>
          <Button variant="ghost" size="icon" aria-label="Open profile">
            <Users />
          </Button>
        </div>
        <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-156px)] w-full max-w-[1440px] items-center gap-10 px-5 pb-28 pt-5 sm:px-10 lg:grid-cols-[minmax(260px,0.72fr)_minmax(390px,1fr)_minmax(220px,0.62fr)] lg:px-14 lg:pb-28 lg:pt-0">
        <div className="order-2 max-w-md animate-rise lg:order-1">
          <div className="mb-5 h-px w-12 bg-primary" />
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            Practise as<br />you’ll be tested.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-foreground/74 sm:text-base">
            Realistic cases. Clear feedback. Stronger clinical decisions.
          </p>
          <blockquote className="mt-10 border-l border-primary/80 pl-4 text-lg italic text-foreground/80">
            “Safer decisions begin before the shift.”
          </blockquote>
        </div>

        <div className="order-1 flex flex-col items-center lg:order-2">
          <button
            type="button"
            onClick={onStart}
            className="exam-orbit group relative grid size-60 place-items-center rounded-full border border-primary/45 bg-background/75 text-foreground shadow-clinical backdrop-blur-md sm:size-72 lg:size-80"
            aria-label="Start exam"
          >
            <span className="absolute inset-3 rounded-full border border-primary/25" />
            <span className="absolute inset-8 rounded-full border border-primary/70" />
            <span className="relative flex flex-col items-center">
              <Brain className="mb-4 size-10 stroke-primary/90 sm:size-12" strokeWidth={1.3} />
              <span className="text-2xl font-semibold sm:text-3xl">Start exam</span>
              <span className="mt-4 grid size-11 place-items-center rounded-full bg-foreground text-background transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="size-5" />
              </span>
            </span>
          </button>

          <div className="mt-8 grid w-full max-w-xl grid-cols-2 gap-4">
            <ModeButton icon={Lightbulb} title="Short practice" detail="Key principles" time="10–15 min" onClick={onStart} />
            <ModeButton icon={FileText} title="Long practice" detail="Full case" time="30–60 min" onClick={onStart} />
          </div>
          <div className="mt-7 flex items-center gap-3 text-center">
            <span className="h-px w-10 bg-border" />
            <span className="technical-label">One aim — better clinical reasoning</span>
            <span className="h-px w-10 bg-border" />
          </div>
        </div>

        <div className="order-3 hidden justify-self-end lg:block">
          <p className="technical-label max-w-[15rem] text-base leading-8">
            Same uncertainty.<br />Better preparation.
          </p>
          <div className="mt-10 space-y-4 text-xs uppercase text-foreground/65">
            {['Knowledge', 'Judgement', 'Action'].map((item) => (
              <div key={item} className="flex items-center gap-3"><span className="h-px w-7 bg-secondary" />{item}</div>
            ))}
          </div>
        </div>
      </section>

      <div className="absolute inset-x-0 bottom-0 border-t border-border/60 bg-background/75 backdrop-blur-lg">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-border/50 px-4 py-4 sm:grid-cols-4 sm:px-10">
          <Feature icon={FileText} label="Varied acute cases" />
          <Feature icon={Brain} label="Reasoning feedback" />
          <Feature icon={Users} label="Designed for clinicians" />
          <Feature icon={MonitorSmartphone} label="Practise anywhere" />
        </div>
      </div>
    </main>
  );
}

function ModeButton({ icon: Icon, title, detail, time, onClick }: { icon: typeof Brain; title: string; detail: string; time: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mode-button group min-w-0 border border-border/80 bg-background/65 px-3 py-4 text-center backdrop-blur-md sm:px-5">
      <Icon className="mx-auto size-6 text-secondary transition-transform group-hover:-translate-y-0.5" strokeWidth={1.5} />
      <span className="mt-3 block text-sm font-semibold sm:text-base">{title}</span>
      <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>
      <span className="technical-label mt-3 block">{time}</span>
    </button>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof Brain; label: string }) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-2 px-2 py-1 text-[10px] text-foreground/70 sm:text-xs">
      <Icon className="size-4 shrink-0 text-primary sm:size-5" strokeWidth={1.5} />
      <span className="truncate">{label}</span>
    </div>
  );
}

function ExamWorkspace({ onExit }: { onExit: () => void }) {
  const [stage, setStage] = useState(0);
  const [answer, setAnswer] = useState("");
  const [openSection, setOpenSection] = useState(0);
  const [listening, setListening] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const browserWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setSpeechMessage("Voice input is not supported in this browser. You can keep typing below.");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-GB";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ");
      setAnswer((current) => `${current}${current ? " " : ""}${transcript}`);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setSpeechMessage("Voice input stopped. Check microphone access or continue typing.");
    };
    recognitionRef.current = recognition;
    recognition.start();
    setSpeechMessage("");
    setListening(true);
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
              <div className="text-xs font-medium">Case 3 of 6</div>
              <div className="text-[10px] text-muted-foreground">Acute medicine</div>
            </div>
            <Button variant="ghost" size="icon" onClick={onExit} aria-label="Close case"><X /></Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 pb-4 sm:px-7">
          <span className="text-xs text-muted-foreground">{stage + 1}/{stages.length}</span>
          <div className="grid flex-1 grid-cols-6 gap-1.5">
            {stages.map((item, index) => (
              <button key={item} type="button" onClick={() => setStage(index)} aria-label={item} className={`h-1 rounded-full transition-colors ${index <= stage ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <span className="technical-label hidden sm:block">{stages[stage]}</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-0 lg:grid-cols-[minmax(0,1.12fr)_minmax(370px,0.88fr)]">
        <section className="min-w-0 px-4 py-6 sm:px-7 lg:border-r lg:border-border/70 lg:px-10 lg:py-9">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs text-secondary"><Activity className="size-4" /> Case presentation</div>
              <h1 className="text-2xl font-semibold sm:text-3xl">Acute shortness of breath</h1>
              <p className="mt-1 text-sm text-muted-foreground">68-year-old man</p>
            </div>
            <span className="shrink-0 rounded-full border border-primary/45 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold uppercase text-primary">Emergency</span>
          </div>

          <div className="patient-story relative border border-border bg-card p-5 sm:p-6">
            <div className="absolute left-0 top-5 h-10 w-px bg-secondary" />
            <p className="text-sm leading-7 text-foreground/82 sm:text-base">
              A 68-year-old man arrives at the emergency department with rapidly worsening shortness of breath over the last two hours. He is anxious, diaphoretic, and reports a heavy pressure in his chest. His history includes hypertension and atrial fibrillation. Regular medication: apixaban, metoprolol, and atorvastatin.
            </p>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <div className="flex items-center gap-2"><HeartPulse className="size-5 text-primary" /><h2 className="text-sm font-semibold">Vital parameters</h2></div>
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
                  <button type="button" onClick={() => setOpenSection(open ? -1 : index)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left">
                    <Icon className="size-4 shrink-0 text-secondary" />
                    <span className="truncate text-sm font-semibold">{section.title}</span>
                    <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
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
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 border border-border bg-card p-3">
      <Icon className={`mt-1 size-5 shrink-0 ${toneClass}`} strokeWidth={1.6} />
      <div className="min-w-0">
        <div className="truncate text-[10px] text-muted-foreground">{label}</div>
        <div className="mt-0.5 truncate text-lg font-semibold leading-none">{value}</div>
        <div className="mt-1 text-[9px] text-muted-foreground">{unit}</div>
      </div>
    </div>
  );
}
