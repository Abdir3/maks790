import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { planCase, saveGeneratedCase, writeStage } from "@/lib/cases.functions";
import { START_SETTINGS } from "@/lib/case-variety";
import type { CaseDefinition } from "@/lib/case-model";
import type { CasePlan, GeneratedStage } from "@/lib/generated-case";

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
  const plan = useServerFn(planCase);
  const stage = useServerFn(writeStage);
  const save = useServerFn(saveGeneratedCase);

  const [stages, setStages] = useState("4");
  const [startSetting, setStartSetting] = useState<string>(START_SETTINGS[0].label);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const busy = status !== null;

  const run = useCallback(async () => {
    if (!format) return;
    const total = format === "long" ? Number(stages) : 1;
    setError(null);
    setProgress(0);
    setStatus("Trekker en ny variant …");
    try {
      const planned = await plan({
        data: { format, stages: total, startSetting: format === "long" ? startSetting : "auto" },
      });
      const parts: GeneratedStage[] = [];
      const count = planned.plan.stages.length;
      for (let index = 0; index < count; index += 1) {
        setStatus(`Skriver del ${index + 1} av ${count} …`);
        setProgress(Math.round(((index + 0.2) / count) * 100));
        const result = await stage({
          data: { plan: planned.plan as CasePlan, index, format },
        });
        parts.push(result.stage as GeneratedStage);
        setProgress(Math.round(((index + 1) / count) * 100));
      }
      setStatus("Lagrer casen …");
      const saved = await save({
        data: { plan: planned.plan as CasePlan, stages: parts, meta: planned.meta },
      });
      setStatus(null);
      onReady(saved.definition as CaseDefinition);
    } catch (caught) {
      setStatus(null);
      setError(caught instanceof Error ? caught.message : "Kunne ikke lage casen. Prøv igjen.");
    }
  }, [format, onReady, plan, save, stage, stages, startSetting]);

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
          <p className="case-eyebrow">MAKS790 / Ny case</p>
          <DialogTitle className="text-2xl">
            {format === "quick" ? "Kort repetisjon" : "Lang eksamenscase"}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {format === "quick"
              ? "Én situasjon, én vanskelig beslutning. Cirka 10–15 minutter."
              : "Én pasient, én sammenhengende historie gjennom flere deler."}
          </DialogDescription>
        </DialogHeader>

        {ready && !user ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-foreground/80">
              Du må være innlogget for å lage nye caser. Da husker vi også hvilke du har hatt, slik
              at neste case blir annerledes.
            </p>
            <Button onClick={() => void navigate({ to: "/auth" })}>Logg inn</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {format === "long" && !busy && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Antall deler</span>
                  <Select value={stages} onValueChange={setStages}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["3", "4", "5", "6"].map((value) => (
                        <SelectItem key={value} value={value}>
                          {value} deler
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Historien starter</span>
                  <Select value={startSetting} onValueChange={setStartSetting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {START_SETTINGS.map((item) => (
                        <SelectItem key={item.id} value={item.label}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>
            )}

            {busy && (
              <div className="space-y-3">
                <p className="text-sm text-foreground/80">{status}</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#ff825e] transition-[width] duration-500"
                    style={{ width: `${Math.max(progress, 6)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Dette tar gjerne ett til to minutter. Ikke lukk vinduet.
                </p>
              </div>
            )}

            {error && <p className="text-sm text-[#ef565c]">{error}</p>}

            {!busy && (
              <Button onClick={() => void run()} className="justify-self-start">
                {error ? "Prøv igjen" : "Lag casen"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
