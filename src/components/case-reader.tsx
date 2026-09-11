import { ArrowRight, BookOpen, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ContentBlocks, PartSituation, QuestionPrompt } from "@/components/case-content";
import { questionsForPart, type CaseDefinition, type LocatedQuestion } from "@/lib/case-model";

export function CaseReader({
  definition,
  open,
  onOpenChange,
  startAt,
  onAnswer,
  viewportHeight,
  readOnly,
}: {
  definition: CaseDefinition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startAt: string | null;
  onAnswer: (question: LocatedQuestion) => void;
  viewportHeight?: number | undefined;
  readOnly?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const position = useRef(0);
  const origin = useRef<HTMLElement | null>(null);
  const answerTarget = useRef<LocatedQuestion | null>(null);
  const sections = [
    ...(definition.background?.length ? [{ id: "background", label: "Bakgrunn" }] : []),
    ...definition.parts.map((part, index) => ({
      id: part.id,
      label: definition.parts.length > 1 ? `Del ${index + 1}` : part.title,
    })),
  ];
  const jump = (id: string) => {
    const element = document.getElementById(`reader-${definition.id}-${id}`);
    if (element && scroller.current)
      scroller.current.scrollTop +=
        element.getBoundingClientRect().top - scroller.current.getBoundingClientRect().top - 20;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="case-reader-dialog"
        style={viewportHeight ? { maxHeight: viewportHeight - 8 } : undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          origin.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
          title.current?.focus();
          requestAnimationFrame(() => {
            if (startAt) jump(startAt);
            else if (scroller.current) scroller.current.scrollTop = position.current;
          });
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (answerTarget.current) {
            const question = answerTarget.current;
            answerTarget.current = null;
            onAnswer(question);
          } else origin.current?.focus({ preventScroll: true });
        }}
      >
        <header className="case-reader-header">
          <div>
            <p className="case-eyebrow">
              <BookOpen aria-hidden="true" />
              Hele casen
            </p>
            <DialogTitle ref={title} tabIndex={-1}>
              {definition.title}
            </DialogTitle>
            <DialogDescription>
              {definition.patient ?? "Situasjon og oppgaver samlet"}
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Lukk lesevisning"
          >
            <X />
          </Button>
        </header>
        {sections.length > 1 && (
          <nav className="case-reader-index" aria-label="Innhold i hele casen">
            {sections.map((section) => (
              <button key={section.id} type="button" onClick={() => jump(section.id)}>
                {section.label}
              </button>
            ))}
          </nav>
        )}
        <div
          className="case-reader-scroll"
          ref={scroller}
          onScroll={(event) => {
            position.current = event.currentTarget.scrollTop;
          }}
        >
          {definition.background?.length ? (
            <section className="reader-section" id={`reader-${definition.id}-background`}>
              <p className="case-eyebrow">Før hendelsen</p>
              <h2>Pasientbakgrunn</h2>
              <ContentBlocks blocks={definition.background} />
            </section>
          ) : null}
          {definition.parts.map((part, index) => (
            <section
              className="reader-section"
              key={part.id}
              id={`reader-${definition.id}-${part.id}`}
            >
              {definition.parts.length > 1 && <p className="case-eyebrow">Del {index + 1}</p>}
              <PartSituation part={part} />
              {questionsForPart(part).map((question) => (
                <div className="reader-question" key={question.id}>
                  <QuestionPrompt question={question} />
                  <Button
                    variant="ghost"
                    onClick={() => {
                      answerTarget.current = question;
                      onOpenChange(false);
                    }}
                  >
                    {readOnly ? "Se svar på" : "Besvar"} {question.label.toLocaleLowerCase("nb-NO")}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </section>
          ))}
        </div>
        <footer className="case-reader-footer">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tilbake til arbeidet
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
