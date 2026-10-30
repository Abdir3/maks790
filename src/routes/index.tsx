import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Landing } from "@/components/landing";
import { CaseWorkspace } from "@/components/case-workspace";
import { CaseGenerator, type GeneratorFormat } from "@/components/case-generator";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { cases } from "@/data/cases";
import { allQuestions, draftKey, type CaseDefinition } from "@/lib/case-model";
import {
  draftSummaryLabel,
  summarizeDraft,
  validatePracticeSearch,
  type DraftSummary,
} from "@/lib/practice-navigation";
import { supabase } from "@/integrations/supabase/client";
import {
  assessCase,
  getModelAnswer,
  deleteGeneratedCase,
  listMyCases,
} from "@/lib/cases.functions";

export const Route = createFileRoute("/")({
  validateSearch: validatePracticeSearch,
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
  const { user, ready } = useAuth();
  const userId = user?.id;
  const { mode, library: openLibraryRequested } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [active, setActive] = useState<CaseDefinition | null>(null);
  const [generating, setGenerating] = useState<GeneratorFormat | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState<{
    owner: string | undefined;
    items: SavedCase[];
    status: "idle" | "loading" | "loaded" | "error";
  }>({ owner: undefined, items: [], status: "idle" });
  const [drafts, setDrafts] = useState<Record<string, DraftSummary>>({});
  const [pendingDelete, setPendingDelete] = useState<SavedCase | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const requestId = useRef(0);
  const deleteRunning = useRef(false);
  const currentUserId = useRef(userId);
  currentUserId.current = userId;
  const list = listMyCases;
  const remove = deleteGeneratedCase;
  const assess = assessCase;
  const modelAnswer = getModelAnswer;
  const saved = library.owner === userId ? library.items : [];

  const refresh = useCallback(() => {
    const request = ++requestId.current;
    if (!ready || !userId) {
      setLibrary({ owner: undefined, items: [], status: "idle" });
      return;
    }
    setLibrary((current) => ({
      owner: userId,
      items: current.owner === userId ? current.items : [],
      status: "loading",
    }));
    void list()
      .then((rows) => {
        if (request !== requestId.current) return;
        setLibrary({ owner: userId, items: rows, status: "loaded" });
      })
      .catch(() => {
        if (request !== requestId.current) return;
        setLibrary((current) => ({ ...current, status: "error" }));
      });
  }, [list, ready, userId]);

  useEffect(() => {
    refresh();
    setPendingDelete(null);
    setDeleteError(null);
    return () => {
      requestId.current += 1;
    };
  }, [refresh]);

  useEffect(() => {
    if (!openLibraryRequested) return;
    setLibraryOpen(true);
    refresh();
    void navigate({ to: "/", search: {}, replace: true });
  }, [openLibraryRequested, refresh, navigate]);

  useEffect(() => {
    if (!ready || !mode) return;
    if (!userId) {
      void navigate({ to: "/auth", search: { mode }, replace: true });
      return;
    }
    setGenerating(mode);
    void navigate({ to: "/", search: {}, replace: true });
  }, [ready, userId, mode, navigate]);

  useEffect(() => {
    if (!libraryOpen) return;
    const readDrafts = () => {
      const summaries: Record<string, DraftSummary> = {};
      const available = library.owner === userId ? library.items : [];
      for (const definition of [...cases, ...available.map((item) => item.definition)]) {
        try {
          summaries[definition.id] = summarizeDraft(
            definition,
            localStorage.getItem(draftKey(definition.id)),
          );
        } catch {
          summaries[definition.id] = {
            state: "unavailable",
            answered: 0,
            total: allQuestions(definition).length,
          };
        }
      }
      setDrafts(summaries);
    };
    readDrafts();
    window.addEventListener("storage", readDrafts);
    return () => window.removeEventListener("storage", readDrafts);
  }, [libraryOpen, library.items, library.owner, userId]);

  const login = (selectedMode?: GeneratorFormat) => {
    setAccountError(null);
    void navigate({ to: "/auth", search: selectedMode ? { mode: selectedMode } : {} });
  };
  const start = (selectedMode: GeneratorFormat) => {
    if (!ready || signingOut) return;
    setLibraryOpen(false);
    if (!userId) login(selectedMode);
    else setGenerating(selectedMode);
  };
  const openLibrary = () => {
    setLibraryOpen(true);
    refresh();
  };
  const openCase = (definition: CaseDefinition) => {
    setLibraryOpen(false);
    setActive(definition);
  };
  const logout = async () => {
    if (signingOut) return false;
    setSigningOut(true);
    setAccountError(null);
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      requestId.current += 1;
      setLibrary({ owner: undefined, items: [], status: "idle" });
      setGenerating(null);
      return true;
    } catch {
      setAccountError("Kunne ikke logge deg ut. Prøv igjen.");
      return false;
    } finally {
      setSigningOut(false);
    }
  };
  const confirmDelete = async () => {
    if (!pendingDelete || deleteRunning.current) return;
    const target = pendingDelete;
    const owner = userId;
    deleteRunning.current = true;
    setDeleting(true);
    setDeleteError(null);
    try {
      await remove({ data: { id: target.id } });
      if (currentUserId.current !== owner) return;
      // An earlier list response must not reintroduce the deleted case.
      requestId.current += 1;
      setLibrary((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== target.id),
      }));
      setPendingDelete(null);
      refresh();
    } catch {
      if (currentUserId.current !== owner) return;
      setDeleteError("Kunne ikke bekrefte at casen ble slettet. Prøv igjen.");
    } finally {
      deleteRunning.current = false;
      setDeleting(false);
    }
  };

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
        onStart={() => start("long")}
        onQuick={() => start("quick")}
        onLibrary={openLibrary}
        onLogin={() => login()}
        onLogout={logout}
        authReady={ready}
        signedIn={Boolean(userId)}
        userEmail={user?.email ?? null}
        signingOut={signingOut}
        accountError={accountError}
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
            <p className="case-eyebrow">MAKS790 / Øving</p>
            <DialogTitle className="text-2xl">Casebibliotek</DialogTitle>
            <DialogDescription className="pt-2">
              Velg en tidligere case eller prøv et åpent eksempel. Svarutkast lagres på denne
              enheten. Svar fra andre enheter vises ikke her.
            </DialogDescription>
          </DialogHeader>
          <section aria-labelledby="personal-cases-title" className="space-y-3">
            <h2 id="personal-cases-title" className="font-semibold">
              Dine genererte caser
            </h2>
            {!ready ? (
              <p role="status" className="text-sm text-muted-foreground">
                Henter kontoen din …
              </p>
            ) : !userId ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Logg inn for å hente casene dine eller lage nye. Eksemplene nedenfor er åpne for
                  alle.
                </p>
                <Button variant="outline" onClick={() => login()}>
                  Logg inn
                </Button>
              </div>
            ) : (
              <>
                {library.status === "loading" && (
                  <p role="status" className="text-sm text-muted-foreground">
                    Henter casene dine …
                  </p>
                )}
                {library.status === "error" && (
                  <div
                    role="alert"
                    className="space-y-2 rounded-lg border border-destructive/40 p-3 text-sm"
                  >
                    <p>Kunne ikke hente casene dine. Prøv igjen.</p>
                    <Button variant="outline" onClick={refresh}>
                      Prøv igjen
                    </Button>
                  </div>
                )}
                {library.status === "loaded" && saved.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Du har ingen genererte caser ennå. Velg kortcase eller langcase nedenfor.
                  </p>
                )}
                <div className="case-library-list">
                  {saved.map((item) => (
                    <div key={item.id} className="flex items-stretch gap-2">
                      <CaseLibraryEntry
                        definition={item.definition}
                        summary={drafts[item.definition.id]}
                        format={
                          item.format === "quick" ? "Kort klinisk case" : "Lang eksamensøving"
                        }
                        onOpen={() => openCase(item.definition)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Slett ${item.title}`}
                        onClick={() => {
                          setDeleteError(null);
                          setPendingDelete(item);
                        }}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
          <section
            aria-labelledby="example-cases-title"
            className="space-y-2 border-t border-white/10 pt-4"
          >
            <h2 id="example-cases-title" className="font-semibold">
              Åpne øvingseksempler
            </h2>
            <p className="text-sm text-muted-foreground">
              Krever ingen konto. Eksemplene har oppgaver og lokal kladd, men ingen
              KI-tilbakemelding eller løsningsforslag.
            </p>
            <div className="case-library-list">
              {cases.map((definition) => (
                <CaseLibraryEntry
                  key={definition.id}
                  definition={definition}
                  summary={drafts[definition.id]}
                  onOpen={() => openCase(definition)}
                />
              ))}
            </div>
          </section>
          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <Button disabled={!ready || signingOut} onClick={() => start("quick")}>
              <Sparkles aria-hidden="true" />
              Ny kortcase
            </Button>
            <Button disabled={!ready || signingOut} variant="outline" onClick={() => start("long")}>
              Ny langcase
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
      >
        <AlertDialogContent className="case-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Slette «{pendingDelete?.title}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Casen fjernes fra kontoen din og kan ikke gjenopprettes her. En eventuell lokal kladd
              slettes ikke, men kan ikke åpnes fra biblioteket etterpå. Åpne casen og kopier svar du
              vil beholde før du sletter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Behold casen</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
              {deleting ? "Sletter …" : "Slett case"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CaseLibraryEntry({
  definition,
  summary,
  format,
  onOpen,
}: {
  definition: CaseDefinition;
  summary: DraftSummary | undefined;
  format?: string;
  onOpen: () => void;
}) {
  const total = allQuestions(definition).length;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-w-0 flex-1 items-center justify-between gap-4 rounded-xl border border-white/15 bg-white/[0.02] p-4 text-left hover:border-orange-200/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200"
    >
      <div className="min-w-0 break-words">
        <strong>{definition.title}</strong>
        {definition.patient && <span>{definition.patient}</span>}
        <small>
          {format ? `${format} · ` : ""}
          {definition.parts.length} {definition.parts.length === 1 ? "del" : "deler"} · {total}{" "}
          {total === 1 ? "oppgave" : "oppgaver"}
        </small>
        <span>{summary ? draftSummaryLabel(summary) : "Henter kladdstatus …"}</span>
        {format && definition.practice?.version !== 3 && (
          <span>Eldre case · uten KI-tilbakemelding og løsningsforslag</span>
        )}
      </div>
      <ArrowRight aria-hidden="true" />
    </button>
  );
}
