import { useEffect, useState } from "react";
import { Check, FileText } from "lucide-react";
import type { GenerationProgress } from "@/lib/case-generation-progress";
import "./case-generation-progress.css";

const copy = {
  preparing: ["Gjør klart for casen", "Setter sammen rammen for øvingen din."],
  queued: ["Snart i gang", "Valgene er mottatt. Venter på at skrivingen starter."],
  writing: ["Casen tar form", "Skriver pasienthistorie, kliniske funn og oppgaver."],
  repairing: ["Tilpasser casen", "Retter ufullstendige opplysninger før casen blir klar."],
  saving: ["Gjør casen klar", "Klargjør den ferdige casen for biblioteket ditt."],
  completed: ["Casen er klar", "Åpner øvingen din …"],
} as const;

export function CaseGenerationProgress({
  progress,
  startedAt,
  updatedAt,
  label,
}: {
  progress: GenerationProgress;
  startedAt: number;
  updatedAt: number | null;
  label: string;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const waitingForUpdate = now - (updatedAt ?? startedAt) > 20_000;
  const phase = progress.phase;
  const [title, description] = copy[phase];
  const active = phase === "preparing" ? 0 : phase === "saving" || phase === "completed" ? 2 : 1;
  return (
    <section className="case-generation-progress" aria-label="Fremdrift for ny case">
      <div className="case-generation-topline">
        <span>{label}</span>
        <span className="case-generation-clock" aria-label="Tid brukt" aria-live="off">
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
        </span>
      </div>
      <div className="case-generation-visual" aria-hidden="true">
        <div className="case-generation-sheet">
          <FileText size={23} strokeWidth={1.6} />
          <span />
          <span />
          <span />
          <span />
          <div className="case-generation-data">
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="case-generation-orbit">
          <span />
        </div>
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="case-generation-message">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <ol className="case-generation-steps" aria-label="Steg i genereringen">
        {["Valg mottatt", "Case og oppgaver", "Klar til øving"].map((step, index) => {
          const done = index < active || phase === "completed";
          const current = index === active && !done;
          return (
            <li
              key={step}
              data-state={done ? "done" : current ? "active" : "waiting"}
              aria-current={current ? "step" : undefined}
            >
              <span className="case-generation-step-icon" aria-hidden="true">
                {done ? <Check size={14} /> : index + 1}
              </span>
              <span>{step}</span>
              <span className="sr-only">
                {done ? ": ferdig" : current ? ": pågår" : ": gjenstår"}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="case-generation-note">
        {waitingForUpdate
          ? "Venter på ny status. Hold fanen åpen mens forbindelsen sjekkes."
          : "Hold fanen åpen. Casen åpnes automatisk når den er klar."}
      </p>
    </section>
  );
}
