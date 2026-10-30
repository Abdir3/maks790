import { useEffect, useState } from "react";
import { Check, FileText } from "lucide-react";
import type { GenerationProgress } from "@/lib/case-generation-progress";
import { generationTargetSeconds } from "@/lib/case-generation-job";
import "./case-generation-progress.css";

const copy = {
  preparing: ["Sender valgene dine", "Venter på bekreftelse på at casen er startet."],
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
  format = "quick",
  accepted = true,
}: {
  progress: GenerationProgress;
  startedAt: number;
  updatedAt: number | null;
  label: string;
  format?: "quick" | "long";
  accepted?: boolean;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const elapsed = Number.isFinite(startedAt)
    ? Math.max(0, Math.floor((now - startedAt) / 1000))
    : 0;
  const waitingForUpdate = now - (updatedAt ?? startedAt) > 20_000;
  const overTarget = elapsed > generationTargetSeconds(format);
  const phase = accepted && progress.phase === "preparing" ? "queued" : progress.phase;
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
        {!accepted
          ? "Vent på bekreftelsen før du lukker fanen."
          : waitingForUpdate
            ? "Venter på ny status. Casen fortsetter i bakgrunnen, også hvis forbindelsen blir brutt."
            : "Du kan lukke fanen eller bruke andre apper. Kom tilbake på samme konto for å følge status eller åpne den ferdige casen."}
      </p>
      <p className="case-generation-note">
        {overTarget
          ? "Dette tar lengre tid enn tidsmålet. Vi henter oppdatert status når casen er klar eller forsøket avsluttes."
          : `Tidsmål: ${format === "quick" ? "innen 2 min 30 sek" : "innen 3 min"}. Fremdriften viser faktisk status.`}
      </p>
    </section>
  );
}
