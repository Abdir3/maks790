import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
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
  const generate = useServerFn(generateCase);
  const [stages, setStages] = useState(4);
  const [startSetting, setStartSetting] = useState<SettingId>("auto");
  const [difficulty, setDifficulty] = useState<Difficulty>("advanced");
  const [topic, setTopic] = useState("auto");
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const compatible = isTopicSettingCompatible(topic, startSetting, format ?? undefined);
  async function run() {
    if (!format || !ready || !user || running.current || !compatible) return;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await generate({
        data: { format, stages: format === "quick" ? 1 : stages, startSetting, difficulty, topic },
      });
      onReady(result.definition);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Kunne ikke lage casen. Prøv igjen.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={format !== null}
      onOpenChange={(open) => {
        if (!open && !busy) {
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="case-library-dialog">
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
            <Button onClick={() => void navigate({ to: "/auth" })}>Logg inn</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {!busy && (
              <div className="case-generator-fields">
                <label>
                  Tema (valgfritt)
                  <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                    <option value="auto">Varier mellom pensumtemaene</option>
                    {TOPICS.map((t) => (
                      <option key={t.id} value={t.id}>
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
                      <option key={s.id} value={s.id}>
                        {s.label}
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
                {!compatible && (
                  <p role="alert">Tema og startsted passer ikke sammen. Velg et annet startsted.</p>
                )}
              </div>
            )}
            <p className="text-sm leading-6 text-muted-foreground">
              Du kan skrive eller diktere, få tilbakemelding og se løsningsforslag. KI-støttet øving
              gir ikke karakter.
            </p>
            {busy && (
              <div role="status" aria-live="polite" className="space-y-2">
                <p>Lager et sammenhengende forløp og kontrollerer kvaliteten …</p>
                <p className="text-sm text-muted-foreground">
                  Det kan ta flere minutter. Casen åpnes først når kontrollen er ferdig.
                </p>
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-[#ef565c]">
                {error}
              </p>
            )}
            {!busy && (
              <Button disabled={!ready || !user || !compatible} onClick={() => void run()}>
                {error ? "Prøv igjen" : "Lag øvingscase"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
