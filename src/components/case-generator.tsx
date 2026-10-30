import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import type { GenerateOptions } from "@/lib/case-api-contract";
import type { GenerationJob } from "@/lib/case-generation-job";
import {
  START_SETTINGS,
  TOPICS,
  isTopicSettingCompatible,
  type SettingId,
  type Difficulty,
} from "@/lib/case-variety";
import type { CaseDefinition } from "@/lib/case-model";
import { CaseGenerationProgress } from "./case-generation-progress";
export type GeneratorFormat = "long" | "quick";
export function CaseGenerator({
  format,
  job,
  starting,
  submittedAt,
  startedAt,
  updatedAt,
  checked,
  error,
  showCompleted,
  onStart,
  onRefresh,
  onClose,
  onReady,
}: {
  format: GeneratorFormat | null;
  job: GenerationJob | null;
  starting: boolean;
  submittedAt: number;
  startedAt: number;
  updatedAt: number | null;
  checked: boolean;
  error: string | null;
  showCompleted: boolean;
  onStart: (options: GenerateOptions) => void;
  onRefresh: () => void;
  onClose: () => void;
  onReady: (definition: CaseDefinition) => void;
}) {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [stages, setStages] = useState(4);
  const [startSetting, setStartSetting] = useState<SettingId>("auto");
  const [difficulty, setDifficulty] = useState<Difficulty>("advanced");
  const [topic, setTopic] = useState("auto");
  const pending = job?.status === "pending" ? job : null;
  const completed = showCompleted && job?.status === "completed" ? job : null;
  const busy = starting || Boolean(pending);
  const activeFormat = pending?.format ?? format;
  const failure = error ?? (job?.status === "failed" ? job.error : null);
  const compatible = isTopicSettingCompatible(topic, startSetting, format ?? undefined);
  const topicLabel = TOPICS.find((item) => item.id === topic)?.label ?? "Automatisk variasjon";
  const settingLabel =
    startSetting === "auto"
      ? "Velges automatisk"
      : START_SETTINGS.find((item) => item.id === startSetting)?.label;
  useEffect(() => {
    if (format && !isTopicSettingCompatible(topic, startSetting, format)) setStartSetting("auto");
  }, [format, topic, startSetting]);
  useEffect(() => {
    if (!pending?.options) return;
    if (pending.options.format === "long") setStages(pending.options.stages);
    setStartSetting(pending.options.startSetting);
    setDifficulty(pending.options.difficulty);
    setTopic(pending.options.topic);
  }, [pending?.id, pending?.options]);
  function changeTopic(nextTopic: string) {
    setTopic(nextTopic);
    if (!isTopicSettingCompatible(nextTopic, startSetting, format ?? undefined))
      setStartSetting("auto");
  }
  function run() {
    if (!format || !ready || !user || !checked || busy || !compatible) return;
    onStart({ format, stages: format === "quick" ? 1 : stages, startSetting, difficulty, topic });
  }
  return (
    <Dialog
      open={format !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="case-library-dialog">
        <DialogHeader>
          <p className="case-eyebrow">MAKS790 / Ny øvingscase</p>
          <DialogTitle className="text-2xl">
            {activeFormat === "quick" ? "Kort klinisk case" : "Lang eksamensøving"}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {activeFormat === "quick"
              ? "Vurder mest sannsynlig diagnose, tolk funnene og forklar hva de betyr for videre håndtering."
              : "Et komplett pasientforløp med åpne oppgaver. Hele casen er tilgjengelig fra starten."}
          </DialogDescription>
        </DialogHeader>
        {ready && !user ? (
          <div className="space-y-4">
            <p>Logg inn for å lage caser og få variasjon basert på tidligere øving.</p>
            <Button
              onClick={() => void navigate({ to: "/auth", search: { mode: format ?? "quick" } })}
            >
              Logg inn og fortsett
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {completed?.definition ? (
              <div className="space-y-4" role="status">
                <p>Casen er klar og lagret i casebiblioteket på kontoen din.</p>
                <Button className="w-full" onClick={() => onReady(completed.definition!)}>
                  Åpne casen
                </Button>
              </div>
            ) : busy ? (
              <CaseGenerationProgress
                progress={
                  starting ? { phase: "preparing" } : (pending?.progress ?? { phase: "queued" })
                }
                startedAt={starting ? submittedAt : startedAt}
                updatedAt={updatedAt}
                format={activeFormat ?? "quick"}
                accepted={!starting && Boolean(pending)}
                label={
                  activeFormat === "quick" ? "Kort klinisk case" : `Eksamenscase · ${stages} deler`
                }
              />
            ) : (
              <>
                <section
                  aria-label="Valgt øving"
                  className="rounded-xl border border-border bg-muted/30 p-4"
                >
                  <p className="font-medium">
                    {format === "quick"
                      ? "Én kortcase med 2–4 spørsmål"
                      : `${stages} deler med åpne oppgaver`}
                  </p>
                  <dl className="mt-3 grid gap-2 text-sm">
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-muted-foreground">Tema:</dt>
                      <dd>{topicLabel}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-muted-foreground">Startsted:</dt>
                      <dd>{settingLabel}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-muted-foreground">Nivå:</dt>
                      <dd>{difficulty === "advanced" ? "Avansert" : "Kompleks"}</dd>
                    </div>
                  </dl>
                </section>
                <details className="group rounded-xl border border-border">
                  <summary className="cursor-pointer rounded-xl px-4 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Tilpass casen
                  </summary>
                  <fieldset
                    disabled={busy}
                    className="case-generator-fields px-4 pb-4 disabled:opacity-60"
                  >
                    <legend className="sr-only">Valgfrie innstillinger</legend>
                    <label>
                      Tema
                      <select value={topic} onChange={(e) => changeTopic(e.target.value)}>
                        <option value="auto">Automatisk variasjon mellom pensumtemaene</option>
                        {TOPICS.map((t) => (
                          <option
                            key={t.id}
                            value={t.id}
                            disabled={!isTopicSettingCompatible(t.id, "auto", format ?? undefined)}
                          >
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Startsted
                      <select
                        value={startSetting}
                        onChange={(e) => setStartSetting(e.target.value as SettingId)}
                      >
                        {START_SETTINGS.map((s) => (
                          <option
                            key={s.id}
                            value={s.id}
                            disabled={!isTopicSettingCompatible(topic, s.id, format ?? undefined)}
                          >
                            {s.id === "auto" ? "Velg automatisk" : s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Faglig utfordring
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                      >
                        <option value="advanced">Avansert – selvstendig vurdering</option>
                        <option value="complex">Kompleks – flere hensyn i konflikt</option>
                      </select>
                    </label>
                    {format === "long" && (
                      <label>
                        Antall deler
                        <select value={stages} onChange={(e) => setStages(Number(e.target.value))}>
                          {[3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>
                              {n} deler
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <p className="text-xs leading-5 text-muted-foreground">
                      Startsteder som ikke passer til temaet, er utilgjengelige. Ved bytte av tema
                      velges startsted automatisk hvis det trengs.
                    </p>
                  </fieldset>
                </details>
                <p className="text-sm leading-6 text-muted-foreground">
                  Du kan skrive eller diktere, få tilbakemelding og se løsningsforslag. KI-støttet
                  øving gir ikke karakter.
                </p>
              </>
            )}
            {failure && !starting && (
              <p role="alert" className="text-sm text-[#ef565c]">
                {failure}
              </p>
            )}
            {busy ? (
              <Button className="w-full" variant="outline" onClick={onClose}>
                {starting ? "Lukk" : "Fortsett i bakgrunnen"}
              </Button>
            ) : !completed?.definition && !checked && user ? (
              <div className="space-y-3">
                <p role="status" className="text-sm text-muted-foreground">
                  Sjekker om du allerede har en case under arbeid …
                </p>
                {error && (
                  <Button className="w-full" variant="outline" onClick={onRefresh}>
                    Sjekk status igjen
                  </Button>
                )}
              </div>
            ) : (
              !completed?.definition && (
                <Button
                  className="w-full"
                  disabled={!checked || !ready || !user || !compatible}
                  onClick={run}
                >
                  {failure ? "Lag en ny case med disse valgene" : "Lag øvingscase"}
                </Button>
              )
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
