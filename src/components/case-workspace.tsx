import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  FileText,
  Mic,
  RotateCcw,
  Save,
  Square,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CaseReader } from "@/components/case-reader";
import { PartSituation, QuestionPrompt } from "@/components/case-content";
import { useCaseDraft } from "@/hooks/use-case-draft";
import { useCaseDictation } from "@/hooks/use-case-dictation";
import {
  allQuestions,
  answeredCount,
  nextQuestion,
  partNavigation,
  previousMeasurements,
  questionsForPart,
  type CaseDefinition,
  type LocatedQuestion,
  type WorkspaceTab,
} from "@/lib/case-model";
import "./case-workspace.css";

function useWorkspaceViewport() {
  const [desktop, setDesktop] = useState(false);
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const media = matchMedia("(min-width: 1024px)");
    const update = () => {
      setDesktop(media.matches);
      setHeight(window.visualViewport?.height ?? window.innerHeight);
    };
    update();
    media.addEventListener("change", update);
    window.visualViewport?.addEventListener("resize", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return { desktop, height };
}

export function CaseWorkspace({
  definition,
  onExit,
}: {
  definition: CaseDefinition;
  onExit: () => void;
}) {
  const { draft, ready, update, reset, storageError, recoveryError } = useCaseDraft(definition);
  const { desktop, height } = useWorkspaceViewport();
  const part = definition.parts.find((item) => item.id === draft.partId) ?? definition.parts[0];
  const partIndex = definition.parts.indexOf(part);
  const questions = allQuestions(definition);
  const partQuestions = questionsForPart(part);
  const count = answeredCount(definition, draft.answers);
  const completed = draft.completedAt !== null;
  const [review, setReview] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerStart, setReaderStart] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<"reset" | "exit" | null>(null);
  const [focusedQuestion, setFocusedQuestion] = useState("");
  const workspace = useRef<HTMLElement>(null);
  const [reflow, setReflow] = useState(false);
  const situationPanel = useRef<HTMLDivElement>(null);
  const answerPanel = useRef<HTMLDivElement>(null);
  const reviewPanel = useRef<HTMLDivElement>(null);
  const positions = useRef<Record<string, number>>({});
  const pendingFocus = useRef<string | null>(null);
  const activeQuestion =
    partQuestions.find((question) => question.id === focusedQuestion) ?? partQuestions[0];
  const followingQuestion = activeQuestion && nextQuestion(definition, activeQuestion.id);

  const append = useCallback(
    (questionId: string, text: string) => {
      update((current) =>
        current.completedAt
          ? current
          : {
              ...current,
              answers: {
                ...current.answers,
                [questionId]: `${current.answers[questionId] ?? ""}${current.answers[questionId] ? " " : ""}${text}`,
              },
            },
      );
    },
    [update],
  );
  const dictation = useCaseDictation(append);

  // Let the whole page scroll when enlarged text or the keyboard leaves too
  // little room for independent panes. Measure actual content, not device names.
  useLayoutEffect(() => {
    const root = workspace.current;
    if (!root) return;
    const chrome = [...root.children].filter(
      (element) => !element.matches(".case-tabs-root, .case-review-scroll"),
    );
    const tabs = root.querySelector(".case-mobile-tabs");
    if (tabs) chrome.push(tabs);
    const measure = () => {
      const occupied = chrome.reduce(
        (total, element) => total + element.getBoundingClientRect().height,
        0,
      );
      setReflow(root.clientHeight - occupied < 240);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    chrome.forEach((element) => observer.observe(element));
    measure();
    return () => observer.disconnect();
  }, [part.id, review, completed, storageError, dictation.status, dictation.message]);

  useLayoutEffect(() => {
    if (!ready || review || completed) return;
    if (situationPanel.current)
      situationPanel.current.scrollTop = positions.current[`${part.id}:situation`] ?? 0;
    if (answerPanel.current)
      answerPanel.current.scrollTop = positions.current[`${part.id}:answer`] ?? 0;
    if (pendingFocus.current) {
      const target = document.getElementById(`answer-${pendingFocus.current}`);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "nearest" });
      pendingFocus.current = null;
    }
  }, [part.id, draft.tab, ready, desktop, review, completed]);

  const openQuestion = (question: LocatedQuestion) => {
    if (completed) {
      document.getElementById(`review-${question.id}`)?.scrollIntoView({ block: "start" });
      return;
    }
    setReview(false);
    setFocusedQuestion(question.id);
    pendingFocus.current = question.id;
    update((current) => ({ ...current, partId: question.partId, tab: "answer" }));
    // Also handle a jump to another question in the currently visible panel.
    requestAnimationFrame(() => {
      const target = document.getElementById(`answer-${question.id}`);
      if (target) {
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: "nearest" });
        pendingFocus.current = null;
      }
    });
  };
  const changePart = (partId: string) => {
    const selected = definition.parts.find((item) => item.id === partId);
    if (!selected) return;
    update((current) => ({
      ...current,
      partId,
      tab: questionsForPart(selected).length ? current.tab : "situation",
    }));
    setFocusedQuestion(questionsForPart(selected)[0]?.id ?? "");
  };
  const changeTab = (tab: string) =>
    update((current) => ({ ...current, tab: tab as WorkspaceTab }));
  const openReader = (start: string | null = null) => {
    setReaderStart(start);
    setReaderOpen(true);
  };
  const exit = () => {
    if (storageError || dictation.busy) setConfirmation("exit");
    else onExit();
  };
  const showReview = () => {
    setReview(true);
    requestAnimationFrame(() => reviewPanel.current?.scrollTo(0, 0));
  };
  const progressLabel = `${count} av ${questions.length} ${questions.length === 1 ? "oppgave" : "oppgaver"} besvart`;
  const navigation = partNavigation(definition);
  const recordingQuestion = questions.find((question) => question.id === dictation.questionId);

  return (
    <main
      ref={workspace}
      className="case-workspace"
      data-reflow={reflow || undefined}
      style={height ? { height } : undefined}
    >
      <header className="case-workspace-header">
        <div className="case-topbar">
          <Button variant="ghost" size="icon" onClick={exit} aria-label="Til forsiden">
            <ArrowLeft />
          </Button>
          <div className="case-identity">
            <p className="case-wordmark">
              MAKS790 <span>/ ØVING</span>
            </p>
            <h1>{definition.title}</h1>
            {definition.patient && <p className="case-patient">{definition.patient}</p>}
          </div>
          <Button variant="outline" className="case-read-button" onClick={() => openReader()}>
            <BookOpen aria-hidden="true" />
            <span>Hele casen</span>
          </Button>
        </div>
        <div className="case-progress-row">
          <span>{completed ? "Besvarelse fullført" : progressLabel}</span>
          <span className="case-save-status" aria-live="polite">
            <Save aria-hidden="true" />
            {!ready ? "Åpner kladd …" : storageError ? "Ikke lagret" : "Lagret på enheten"}
          </span>
        </div>
        <div
          className="case-progress-track"
          role="progressbar"
          aria-label="Besvarte oppgaver"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={questions.length}
        >
          <span style={{ width: `${(count / questions.length) * 100}%` }} />
        </div>
        {!review && !completed && navigation === "buttons" && (
          <nav className="case-part-nav" aria-label="Deler i casen">
            {definition.parts.map((item, index) => {
              const items = questionsForPart(item);
              const done =
                items.length > 0 && items.every((question) => draft.answers[question.id]?.trim());
              return (
                <button
                  type="button"
                  key={item.id}
                  disabled={!ready}
                  aria-current={item.id === part.id ? "step" : undefined}
                  onClick={() => changePart(item.id)}
                >
                  <span className="case-part-number">
                    {done ? <Check aria-label="Besvart" /> : index + 1}
                  </span>
                  <span>{item.shortTitle ?? item.title}</span>
                </button>
              );
            })}
          </nav>
        )}
        {!review && !completed && navigation === "select" && (
          <div className="case-part-select">
            <Select value={part.id} onValueChange={changePart} disabled={!ready}>
              <SelectTrigger aria-label="Velg del">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {definition.parts.map((item, index) => (
                  <SelectItem key={item.id} value={item.id}>
                    Del {index + 1} av {definition.parts.length} · {item.shortTitle ?? item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </header>

      {storageError && (
        <div className="case-notice" role="alert">
          {recoveryError
            ? "Den lagrede kladden kunne ikke åpnes. Du kan skrive her uten å overskrive den gamle kladden."
            : "Kladden kunne ikke lagres på enheten. Behold denne fanen åpen, eller kopier svarene dine før du går."}
          <Button variant="ghost" onClick={() => setConfirmation("reset")}>
            Start ny kladd
          </Button>
        </div>
      )}
      {dictation.busy && (
        <div className="case-dictation-status" role="status">
          <span
            className={
              dictation.status === "recording"
                ? "case-recording-indicator"
                : "case-processing-indicator"
            }
          />
          <span>
            {dictation.status === "recording"
              ? "Tar opp"
              : dictation.status === "requesting"
                ? "Venter på mikrofontilgang"
                : "Transkriberer"}{" "}
            · {recordingQuestion?.label}
          </span>
          {dictation.status === "recording" && (
            <Button variant="ghost" onClick={dictation.stop}>
              <Square aria-hidden="true" />
              Stopp
            </Button>
          )}
        </div>
      )}
      {dictation.message && (
        <p className="case-notice" role="status">
          {dictation.message}
        </p>
      )}

      {review || completed ? (
        <>
          <div className="case-review-scroll" ref={reviewPanel}>
            <div className="case-review-intro">
              <span className="case-review-icon">{completed ? <CheckCheck /> : <FileText />}</span>
              <p className="case-eyebrow">{completed ? "Fullført" : "Før du fullfører"}</p>
              <h2>{completed ? "Besvarelsen din" : "Se gjennom besvarelsen"}</h2>
              <p>
                {completed
                  ? "Oppgavene og svarene dine er samlet her."
                  : "Les over svarene dine. Du kan gå tilbake og endre dem før du fullfører."}
              </p>
              {count < questions.length && (
                <p className="case-unanswered">
                  {questions.length - count}{" "}
                  {questions.length - count === 1 ? "oppgave står" : "oppgaver står"} ubesvart.
                </p>
              )}
            </div>
            {definition.parts.map(
              (item, index) =>
                questionsForPart(item).length > 0 && (
                  <section key={item.id} className="case-review-part">
                    {definition.parts.length > 1 && (
                      <h2>
                        Del {index + 1} · {item.shortTitle ?? item.title}
                      </h2>
                    )}
                    {questionsForPart(item).map((question) => (
                      <article
                        id={`review-${question.id}`}
                        className="case-review-answer"
                        key={question.id}
                      >
                        <QuestionPrompt question={question} />
                        <p
                          className={
                            draft.answers[question.id]?.trim()
                              ? "case-answer-text"
                              : "case-empty-answer"
                          }
                        >
                          {draft.answers[question.id]?.trim()
                            ? draft.answers[question.id]
                            : "Ikke besvart"}
                        </p>
                        {!completed && (
                          <Button variant="outline" onClick={() => openQuestion(question)}>
                            Rediger {question.label.toLocaleLowerCase("nb-NO")}
                            <ArrowRight aria-hidden="true" />
                          </Button>
                        )}
                      </article>
                    ))}
                  </section>
                ),
            )}
          </div>
          <footer className="case-actionbar">
            {completed ? (
              <>
                <Button variant="outline" onClick={() => setConfirmation("reset")}>
                  <RotateCcw />
                  Start på nytt
                </Button>
                <Button onClick={exit}>
                  Til forsiden
                  <ArrowRight />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setReview(false)}>
                  <ArrowLeft />
                  Tilbake
                </Button>
                <Button
                  disabled={!ready || dictation.busy}
                  onClick={() => {
                    update((current) => ({ ...current, completedAt: new Date().toISOString() }));
                    reviewPanel.current?.scrollTo(0, 0);
                  }}
                >
                  Fullfør case
                  <Check />
                </Button>
              </>
            )}
          </footer>
        </>
      ) : (
        <>
          <Tabs
            value={partQuestions.length ? draft.tab : "situation"}
            onValueChange={changeTab}
            className="case-tabs-root"
          >
            {partQuestions.length > 0 && (
              <TabsList className="case-mobile-tabs" aria-label="Casearbeid">
                <TabsTrigger value="situation" disabled={!ready}>
                  Situasjon
                </TabsTrigger>
                <TabsTrigger value="answer" disabled={!ready}>
                  Oppgave og svar
                </TabsTrigger>
              </TabsList>
            )}
            <div
              className={`case-columns ${partQuestions.length === 0 ? "case-information-only" : ""}`}
            >
              <TabsContent
                forceMount
                value="situation"
                hidden={!desktop && draft.tab !== "situation"}
                className="case-panel case-situation-panel"
                ref={situationPanel}
                onScroll={(event) => {
                  positions.current[`${part.id}:situation`] = event.currentTarget.scrollTop;
                }}
              >
                <div className="case-panel-inner">
                  <div className="case-situation-meta">
                    <span className="case-eyebrow">
                      {definition.parts.length > 1
                        ? `Del ${partIndex + 1} av ${definition.parts.length}`
                        : (definition.specialty ?? "Situasjon")}
                    </span>
                    {definition.background?.length ? (
                      <button type="button" onClick={() => openReader("background")}>
                        <BookOpen aria-hidden="true" />
                        Pasientbakgrunn
                      </button>
                    ) : null}
                  </div>
                  <PartSituation part={part} previous={previousMeasurements(definition, part.id)} />
                  {partQuestions.length > 0 && (
                    <div className="case-task-preview">
                      <p className="case-eyebrow">Til denne delen</p>
                      {partQuestions.map((question) => (
                        <button
                          type="button"
                          key={question.id}
                          onClick={() => openQuestion(question)}
                        >
                          <span>{question.label}</span>
                          <ArrowRight aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              {partQuestions.length > 0 && (
                <TabsContent
                  forceMount
                  value="answer"
                  hidden={!desktop && draft.tab !== "answer"}
                  className="case-panel case-answer-panel"
                  ref={answerPanel}
                  onScroll={(event) => {
                    positions.current[`${part.id}:answer`] = event.currentTarget.scrollTop;
                  }}
                >
                  <div className="case-panel-inner">
                    <div className="case-answer-intro">
                      <p className="case-eyebrow">Din besvarelse</p>
                      <p>Skriv resonnementet ditt, eller bruk diktering.</p>
                    </div>
                    {partQuestions.map((question) => (
                      <section className="case-answer-card" key={question.id}>
                        <QuestionPrompt question={question} headingId={`prompt-${question.id}`} />
                        <div className="case-editor">
                          <Textarea
                            id={`answer-${question.id}`}
                            aria-label={`Svar på ${question.label.toLocaleLowerCase("nb-NO")}`}
                            aria-describedby={`prompt-${question.id}`}
                            disabled={!ready}
                            value={draft.answers[question.id] ?? ""}
                            onFocus={() => setFocusedQuestion(question.id)}
                            onChange={(event) => {
                              const value = event.target.value;
                              update((current) => ({
                                ...current,
                                answers: { ...current.answers, [question.id]: value },
                              }));
                            }}
                            placeholder="Skriv svaret ditt her …"
                          />
                          <div className="case-editor-tools">
                            <span>
                              {draft.answers[question.id]?.trim()
                                ? (draft.answers[question.id] ?? "").trim().split(/\s+/).length
                                : 0}{" "}
                              ord
                            </span>
                            <Button
                              variant="ghost"
                              disabled={!ready || dictation.busy}
                              onClick={() => dictation.start(question.id)}
                              aria-label={`Dikter svar til ${question.label.toLocaleLowerCase("nb-NO")}`}
                            >
                              <Mic aria-hidden="true" />
                              Dikter
                            </Button>
                          </div>
                        </div>
                      </section>
                    ))}
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
          <footer className="case-actionbar">
            <Button
              variant="ghost"
              className="case-review-link"
              onClick={showReview}
              disabled={!ready}
            >
              <FileText aria-hidden="true" />
              Se gjennom
            </Button>
            {partQuestions.length === 0 ? (
              <Button
                disabled={!ready}
                onClick={() => {
                  const nextPart = definition.parts[partIndex + 1];
                  if (nextPart) changePart(nextPart.id);
                  else showReview();
                }}
              >
                {partIndex < definition.parts.length - 1 ? "Neste del" : "Se besvarelsen"}
                <ArrowRight />
              </Button>
            ) : !desktop && draft.tab === "situation" ? (
              <Button
                disabled={!ready}
                onClick={() => activeQuestion && openQuestion(activeQuestion)}
              >
                Til besvarelsen
                <ArrowRight />
              </Button>
            ) : (
              <Button
                disabled={!ready}
                onClick={() => (followingQuestion ? openQuestion(followingQuestion) : showReview())}
              >
                {followingQuestion ? "Neste oppgave" : "Se besvarelsen"}
                <ArrowRight />
              </Button>
            )}
          </footer>
        </>
      )}

      <CaseReader
        definition={definition}
        open={readerOpen}
        onOpenChange={setReaderOpen}
        startAt={readerStart}
        onAnswer={openQuestion}
        viewportHeight={height}
        readOnly={completed}
      />
      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmation(null);
        }}
      >
        <AlertDialogContent className="case-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation === "reset" ? "Starte en ny besvarelse?" : "Forlate casen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation === "reset"
                ? "Dette erstatter den lagrede besvarelsen for denne casen på denne enheten."
                : dictation.busy
                  ? "Dikteringen pågår. Hvis du forlater casen nå, avbrytes opptaket eller transkriberingen. Allerede lagrede svar beholdes."
                  : "Svarene kunne ikke lagres på denne enheten. Kopier dem før du forlater casen hvis du vil beholde dem."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmation === "reset") {
                  if (!dictation.busy) {
                    reset();
                    setReview(false);
                    positions.current = {};
                  }
                } else onExit();
                setConfirmation(null);
              }}
              disabled={confirmation === "reset" && dictation.busy}
            >
              {confirmation === "reset" ? "Start på nytt" : "Forlat casen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
