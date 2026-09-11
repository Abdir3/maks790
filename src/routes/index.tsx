import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Landing } from "@/components/landing";
import { CaseWorkspace } from "@/components/case-workspace";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cases } from "@/data/cases";
import { allQuestions } from "@/lib/case-model";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { case?: string } =>
    typeof search["case"] === "string" ? { case: search["case"] } : {},
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

function Index() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const selected = cases.find((item) => item.id === search.case);
  if (selected)
    return (
      <CaseWorkspace
        key={selected.id}
        definition={selected}
        onExit={() => navigate({ search: {} })}
      />
    );
  return (
    <>
      <Landing onStart={() => setLibraryOpen(true)} />
      <Dialog
        open={libraryOpen || Boolean(search.case)}
        onOpenChange={(open) => {
          setLibraryOpen(open);
          if (!open && search.case) void navigate({ search: {} });
        }}
      >
        <DialogContent className="case-library-dialog">
          <DialogHeader>
            <p className="case-eyebrow">MAKS790 / Øving</p>
            <DialogTitle className="text-2xl">Velg en case</DialogTitle>
            <DialogDescription className="pt-2">
              Les, vurder og sett ord på resonnementet ditt. Kladden lagres på denne enheten.
            </DialogDescription>
          </DialogHeader>
          <div className="case-library-list">
            {cases.map((item) => {
              const total = allQuestions(item).length;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setLibraryOpen(false);
                    void navigate({ search: { case: item.id } });
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
        </DialogContent>
      </Dialog>
    </>
  );
}
