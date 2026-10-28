import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Landing } from "@/components/landing";
import { CaseWorkspace } from "@/components/case-workspace";
import { CaseGenerator, type GeneratorFormat } from "@/components/case-generator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { cases } from "@/data/cases";
import { allQuestions, type CaseDefinition } from "@/lib/case-model";
import {
  assessCase,
  getModelAnswer,
  deleteGeneratedCase,
  listMyCases,
} from "@/lib/cases.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAKS790 — Øv som på eksamen" },
      {
        name: "description",
        content:
          "Øv på klinisk resonnering i akuttmedisin med nye, uforutsigbare pasienthistorier.",
      },
      { property: "og:title", content: "MAKS790 — Øv som på eksamen" },
      {
        property: "og:description",
        content:
          "Øv på klinisk resonnering i akuttmedisin med nye, uforutsigbare pasienthistorier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type SavedCase = {
  id: string;
  title: string;
  format: "long" | "quick";
  definition: CaseDefinition;
};

function Index() {
  const { user } = useAuth();
  const [active, setActive] = useState<CaseDefinition | null>(null);
  const [generating, setGenerating] = useState<GeneratorFormat | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [saved, setSaved] = useState<SavedCase[]>([]);
  const list = useServerFn(listMyCases);
  const remove = useServerFn(deleteGeneratedCase);
  const assess = useServerFn(assessCase);
  const modelAnswer = useServerFn(getModelAnswer);

  const refresh = useCallback(() => {
    if (!user) {
      setSaved([]);
      return;
    }
    void list()
      .then((rows) =>
        setSaved(
          rows.map((row) => ({
            id: row.id,
            title: row.title,
            format: row.format,
            definition: row.definition,
          })),
        ),
      )
      .catch(() => setSaved([]));
  }, [list, user]);

  useEffect(refresh, [refresh]);

  if (active)
    return (
      <CaseWorkspace
        key={active.id}
        definition={active}
        {...(active.practice?.version === 3
          ? {
              onAssess: (answers: Record<string, string>, solutionViewed?: boolean) =>
                assess({ data: { id: active.id.replace(/^gen-/, ""), answers, solutionViewed } }),
              onModelAnswer: () => modelAnswer({ data: { id: active.id.replace(/^gen-/, "") } }),
            }
          : {})}
        onExit={() => {
          setActive(null);
          refresh();
        }}
      />
    );

  return (
    <>
      <Landing
        onStart={() => setGenerating("long")}
        onQuick={() => setGenerating("quick")}
        onLibrary={() => setLibraryOpen(true)}
      />

      <CaseGenerator
        format={generating}
        onClose={() => setGenerating(null)}
        onReady={(definition) => {
          setGenerating(null);
          setActive(definition);
        }}
      />

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="case-library-dialog">
          <DialogHeader>
            <p className="case-eyebrow">MAKS790 / Mine caser</p>
            <DialogTitle className="text-2xl">Velg en case</DialogTitle>
            <DialogDescription className="pt-2">
              Casene du har laget, sammen med de faste øvingscasene. Kladden lagres på denne
              enheten.
            </DialogDescription>
          </DialogHeader>
          <div className="case-library-list">
            {saved.map((item) => {
              const total = allQuestions(item.definition).length;
              return (
                <div key={item.id} className="flex items-stretch gap-2">
                  <button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      setLibraryOpen(false);
                      setActive(item.definition);
                    }}
                  >
                    <div>
                      <strong>{item.title}</strong>
                      {item.definition.patient && <span>{item.definition.patient}</span>}
                      <small>
                        {item.format === "quick" ? "Kort repetisjon" : "Lang case"} ·{" "}
                        {item.definition.parts.length}{" "}
                        {item.definition.parts.length === 1 ? "del" : "deler"} · {total}{" "}
                        {total === 1 ? "oppgave" : "oppgaver"}
                      </small>
                    </div>
                    <ArrowRight aria-hidden="true" />
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Slett ${item.title}`}
                    onClick={() => {
                      setSaved((current) => current.filter((row) => row.id !== item.id));
                      void remove({ data: { id: item.id } }).catch(() => refresh());
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              );
            })}

            {cases.map((item) => {
              const total = allQuestions(item).length;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setLibraryOpen(false);
                    setActive(item);
                  }}
                >
                  <div>
                    <strong>{item.title}</strong>
                    {item.patient && <span>{item.patient}</span>}
                    <small>
                      {item.parts.length === 1
                        ? "Én samlet situasjon"
                        : item.parts.length + " deler"}{" "}
                      · {total} {total === 1 ? "oppgave" : "oppgaver"}
                    </small>
                  </div>
                  <ArrowRight aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <Button
            className="mt-2 justify-self-start"
            onClick={() => {
              setLibraryOpen(false);
              setGenerating("long");
            }}
          >
            <Sparkles aria-hidden="true" />
            Lag en ny case
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
