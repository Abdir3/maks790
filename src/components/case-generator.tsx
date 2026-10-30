import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { generateCase } from "@/lib/cases.functions";
import {
  START_SETTINGS,
  TOPICS,
  isTopicSettingCompatible,
  type SettingId,
  type Difficulty,
} from "@/lib/case-variety";
import type { CaseDefinition } from "@/lib/case-model";
export type GeneratorFormat = "long" | "quick";
const GENERATION_WAIT_MS = 21 * 60_000;
export function CaseGenerator({
  format,
  onClose,
  onReady,
}: {
  format: GeneratorFormat | null;
  onClose: () => void;
  onReady: (definition: CaseDefinition) => void;
}) {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const generate = generateCase;
  const [stages, setStages] = useState(4);
  const [startSetting, setStartSetting] = useState<SettingId>("auto");
  const [difficulty, setDifficulty] = useState<Difficulty>("advanced");
  const [topic, setTopic] = useState("auto");
  const [busy, setBusy] = useState(false);
  const activeRequest = useRef<symbol | null>(null);
  const currentUserId = useRef(user?.id);
  currentUserId.current = user?.id;
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const compatible = isTopicSettingCompatible(topic, startSetting, format ?? undefined);
  const topicLabel = TOPICS.find((item) => item.id === topic)?.label ?? "Automatisk variasjon";
  const settingLabel =
    startSetting === "auto"
      ? "Velges automatisk"
      : START_SETTINGS.find((item) => item.id === startSetting)?.label;
  useEffect(() => {
    if (format && !isTopicSettingCompatible(topic, startSetting, format)) setStartSetting("auto");
  }, [format, topic, startSetting]);
  useEffect(() => setError(null), [format]);
  useEffect(() => {
    // A request belongs to the account that started it, even if another tab signs out.
    if (!activeRequest.current) return;
    activeRequest.current = null;
    if (waitTimer.current !== null) clearTimeout(waitTimer.current);
    waitTimer.current = null;
    setBusy(false);
    setError(
      "Innloggingen er endret. Casen kan fortsatt bli lagret på kontoen som startet den. Sjekk casebiblioteket på den kontoen før du prøver igjen.",
    );
  }, [user?.id]);
  useEffect(
    () => () => {
      activeRequest.current = null;
      if (waitTimer.current !== null) clearTimeout(waitTimer.current);
    },
    [],
  );
  function changeTopic(nextTopic: string) {
    setTopic(nextTopic);
    if (!isTopicSettingCompatible(nextTopic, startSetting, format ?? undefined))
      setStartSetting("auto");
  }
  async function run() {
    if (!format || !ready || !user || activeRequest.current || !compatible) return;
    const request = Symbol("case-request");
    const requestOwner = user.id;
    activeRequest.current = request;
    const isCurrentRequest = () =>
      activeRequest.current === request && currentUserId.current === requestOwner;
    function releaseRequest() {
      if (activeRequest.current !== request) return false;
      activeRequest.current = null;
      if (waitTimer.current !== null) clearTimeout(waitTimer.current);
      waitTimer.current = null;
      return true;
    }
    setBusy(true);
    setError(null);
    waitTimer.current = setTimeout(() => {
      if (!isCurrentRequest()) return;
      if (!releaseRequest()) return;
      setBusy(false);
      setError(
        "Dette tar lengre tid enn ventet. Casen kan fortsatt bli lagret. Sjekk casebiblioteket før du prøver igjen.",
      );
    }, GENERATION_WAIT_MS);
    try {
      const result = await generate({
        data: { format, stages: format === "quick" ? 1 : stages, startSetting, difficulty, topic },
      });
      // A timed-out or unmounted request must not navigate later or affect a retry.
      if (isCurrentRequest()) onReady(result.definition);
    } catch (caught) {
      if (isCurrentRequest())
        setError(caught instanceof Error ? caught.message : "Kunne ikke lage casen. Prøv igjen.");
    } finally {
      if (releaseRequest()) setBusy(false);
    }
  }
  return (
    <Dialog
      open={format !== null}
      onOpenChange={(open) => {
        if (!open && !activeRequest.current) {
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="case-library-dialog" closeDisabled={busy}>
        <DialogHeader>
          <p className="case-eyebrow">MAKS790 / Ny øvingscase</p>
          <DialogTitle className="text-2xl">
            {format === "quick" ? "Kort klinisk case" : "Lang eksamensøving"}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {format === "quick"
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
              Du kan skrive eller diktere, få tilbakemelding og se løsningsforslag. KI-støttet øving
              gir ikke karakter.
            </p>
            {busy && (
              <div role="status" aria-live="polite" className="space-y-2">
                <p>Lager casen og kontrollerer kvaliteten …</p>
                <p className="text-sm text-muted-foreground">
                  Det kan ta flere minutter. Hold denne fanen åpen. Casen åpnes her når den er klar.
                </p>
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-[#ef565c]">
                {error}
              </p>
            )}
            <Button
              className="w-full"
              disabled={busy || !ready || !user || !compatible}
              onClick={() => void run()}
            >
              {busy ? "Lager case …" : error ? "Prøv igjen med disse valgene" : "Lag øvingscase"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
