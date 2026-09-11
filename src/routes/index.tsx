import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Brain,
  ChevronDown,
  ClipboardList,
  Clock3,
  HeartPulse,
  Mic,
  Pause,
  Stethoscope,
  Thermometer,
  Volume2,
  Wind,
  X,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Brand, Landing } from "@/components/landing";
import { transcribeAudio } from "@/lib/transcribe.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAKS790 — Øv som på eksamen" },
      {
        name: "description",
        content: "Øv på klinisk resonnering i akuttmedisin med realistiske pasienthistorier.",
      },
      { property: "og:title", content: "MAKS790 — Øv som på eksamen" },
      {
        property: "og:description",
        content: "Øv på klinisk resonnering i akuttmedisin med realistiske pasienthistorier.",
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
              <Button variant={listening ? "default" : "outline"} size="icon" disabled={transcribing} onClick={toggleListening} aria-label={listening ? "Stopp diktering" : "Start diktering"} title={listening ? "Stopp diktering" : "Start diktering"}>
                {listening ? <Pause /> : <Mic />}
              </Button>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Talk through your reasoning as you would in the exam, or type your answer.
            </p>

            {listening && (
              <div className="mt-4 flex items-center gap-3 border border-primary/40 bg-primary/8 px-4 py-3 text-xs text-primary">
                <span className="recording-dot size-2 rounded-full bg-primary" /> Tar opp… snakk naturlig, trykk stopp når du er ferdig
              </div>
            )}
            {transcribing && (
              <div className="mt-4 flex items-center gap-3 border border-secondary/40 bg-secondary/10 px-4 py-3 text-xs text-secondary">
                <span className="recording-dot size-2 rounded-full bg-secondary" /> Transkriberer opptaket…
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
