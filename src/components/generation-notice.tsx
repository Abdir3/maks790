import { CheckCircle2, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GenerationJob } from "@/lib/case-generation-job";

export function GenerationNotice({
  job,
  onReview,
  onOpen,
  onOpenSaved,
  onDismiss,
}: {
  job: GenerationJob;
  onReview: () => void;
  onOpen: () => void;
  onOpenSaved?: () => void;
  onDismiss?: () => void;
}) {
  const pending = job.status === "pending";
  const completed = job.status === "completed" && Boolean(job.definition);
  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-lg"
      aria-label="Din siste case"
    >
      <div className="flex items-start gap-3">
        {pending ? (
          <LoaderCircle
            className="mt-0.5 size-5 shrink-0 motion-safe:animate-spin"
            aria-hidden="true"
          />
        ) : completed ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="font-semibold" role="status">
            {pending
              ? "Casen lages i bakgrunnen"
              : completed
                ? "Casen er klar"
                : "Casen kunne ikke bli ferdig"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pending
              ? "Du kan lukke fanen. Følg med her når du kommer tilbake på samme konto."
              : completed
                ? "Den er lagret i casebiblioteket og kan åpnes på alle enhetene dine."
                : (job.error ?? "Forsøket er avsluttet. Du kan prøve å lage en ny case.")}
          </p>
        </div>
        {onDismiss && !pending && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            aria-label="Skjul beskjed om casen"
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>
      {!pending && !completed && onOpenSaved && (
        <p className="mt-3 text-sm text-muted-foreground">
          Du har allerede en ferdig case i biblioteket. Den kan åpnes uten ny generering.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {!pending && !completed && onOpenSaved && (
          <Button size="sm" onClick={onOpenSaved}>
            Åpne siste lagrede case
          </Button>
        )}
        <Button
          size="sm"
          variant={completed ? "default" : "outline"}
          onClick={completed ? onOpen : onReview}
        >
          {pending ? "Se fremdrift" : completed ? "Åpne casen" : "Se valg for ny case"}
        </Button>
      </div>
    </section>
  );
}
