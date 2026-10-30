import { useState } from "react";
import { Button } from "./ui/button";
import type { SourceLink } from "@/lib/case-contract";
import type { CaseLearning } from "@/hooks/use-case-learning";
import { allQuestions, type CaseDefinition } from "@/lib/case-model";

export type { AssessAnswers, GetModelAnswer } from "@/hooks/use-case-learning";
const statusLabels = {
  developed: "Resonnementet er godt utviklet",
  partial: "Resonnementet kan utdypes",
  "needs-review": "Vurder dette på nytt",
  unanswered: "Ikke besvart",
};

function Sources({ ids, sources }: { ids: string[]; sources: SourceLink[] }) {
  if (!ids.some((id) => sources.some((source) => source.id === id))) return null;
  return (
    <details>
      <summary>Kildegrunnlag</summary>
      {ids.map((id) => {
        const source = sources.find((item) => item.id === id);
        return source ? (
          <p key={id}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.title}
            </a>
            <br />
            {source.scope}
          </p>
        ) : null;
      })}
    </details>
  );
}

export function CaseFeedbackPanel({
  definition,
  learning,
  onEditQuestion,
  hasModelAnswer = false,
  solutionUsed = false,
  disabled = false,
}: {
  definition: CaseDefinition;
  learning: CaseLearning;
  onEditQuestion: (questionId: string) => void;
  hasModelAnswer?: boolean;
  solutionUsed?: boolean;
  disabled?: boolean;
}) {
  const questions = allQuestions(definition);
  const { assessment, solution, solutionOpen, busy, error, feedbackIsCurrent } = learning;
  const [report, setReport] = useState("");
  const result = assessment?.result;

  return (
    <section className="case-feedback" aria-label="Tilbakemelding og løsningsforslag">
      <p className="case-eyebrow">Arbeid videre med casen</p>
      <h2>Tilbakemelding og løsningsforslag</h2>
      <p>
        Få en samlet vurdering av svarene dine, eller se et begrunnet løsningsforslag. Du kan bruke
        begge før du fullfører.
      </p>
      <div className="case-learning-actions">
        <Button disabled={disabled || busy !== null} onClick={learning.requestFeedback}>
          {busy === "feedback"
            ? "Vurderer besvarelsen …"
            : result
              ? feedbackIsCurrent
                ? "Vurder svarene på nytt"
                : "Vurder oppdaterte svar"
              : "Få tilbakemelding"}
        </Button>
        {hasModelAnswer && (
          <Button
            variant="outline"
            disabled={disabled || (busy !== null && !solution)}
            onClick={learning.toggleSolution}
          >
            {busy === "solution"
              ? "Henter løsningsforslag …"
              : solutionOpen
                ? "Skjul løsningsforslag"
                : solution
                  ? "Vis løsningsforslaget igjen"
                  : "Se løsningsforslag"}
          </Button>
        )}
      </div>
      <p className="case-learning-note">
        Tilbakemelding og løsningsforslag beholdes mens casen er åpen. Kopier det du vil ta vare på.
      </p>
      {solutionUsed && <p className="case-solution-marker">Øvd med løsningsforslag</p>}
      {busy && (
        <p role="status">
          {busy === "feedback"
            ? "Vurderer helheten og begrunnelsene i hver oppgave. Dette kan ta noen minutter."
            : "Henter det faglige løsningsforslaget."}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {assessment && !feedbackIsCurrent && (
        <p className="case-feedback-version" role="status">
          Svarene er endret. Tilbakemeldingen nedenfor gjelder den forrige besvarelsen. Be om ny
          tilbakemelding når du vil vurdere de oppdaterte svarene.
        </p>
      )}
      {result && (
        <div
          aria-label={
            feedbackIsCurrent
              ? "Tilbakemelding på aktuell besvarelse"
              : "Tilbakemelding på tidligere besvarelse"
          }
        >
          <h3>{feedbackIsCurrent ? "Helhetsvurdering" : "Helhetsvurdering av tidligere svar"}</h3>
          {solutionUsed && assessment && !assessment.solutionViewed && (
            <p className="case-learning-note">
              Denne tilbakemeldingen ble hentet før løsningsforslaget ble åpnet.
            </p>
          )}
          <p className="case-answer-text">{result.feedback.summary}</p>
          {result.feedback.questions.map((item) => (
            <article className="case-feedback-item" key={item.questionId}>
              <h3>
                {questions.find((q) => q.id === item.questionId)?.label} ·{" "}
                {statusLabels[item.status]}
              </h3>
              <p className="case-feedback-question">
                {questions.find((q) => q.id === item.questionId)?.prompt}
              </p>
              {item.evidence && <blockquote>«{item.evidence}»</blockquote>}
              {(
                [
                  ["Viktige hensyn", item.safety],
                  ["Styrker", item.strengths],
                  ["Utvikle videre", item.improvements],
                  ["Forsvarlige alternativer", item.alternatives],
                ] as const
              ).map(
                ([title, items]) =>
                  items.length > 0 && (
                    <div key={title}>
                      <h4>{title}</h4>
                      <ul>
                        {items.map((text, i) => (
                          <li key={i}>{text}</li>
                        ))}
                      </ul>
                    </div>
                  ),
              )}
              <p>
                <strong>Neste steg:</strong> {item.nextStep}
              </p>
              <Sources ids={item.sourceIds} sources={result.sources} />
              <Button
                variant="outline"
                onClick={() => onEditQuestion(item.questionId)}
                disabled={disabled}
              >
                Rediger dette svaret
              </Button>
            </article>
          ))}
        </div>
      )}
      {solution && solutionOpen && (
        <section className="case-model-answer" aria-label="Begrunnet løsningsforslag">
          <h3>Løsningsforslag</h3>
          <p className="case-answer-text">{solution.modelAnswer.summary}</p>
          {solution.modelAnswer.questions.map((item) => (
            <article className="case-feedback-item" key={item.questionId}>
              <h3>{questions.find((q) => q.id === item.questionId)?.label}</h3>
              <p className="case-feedback-question">
                {questions.find((q) => q.id === item.questionId)?.prompt}
              </p>
              <p className="case-answer-text">{item.explanation}</p>
              <h4>Funn som bærer vurderingen</h4>
              <ul>
                {item.keyFindings.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
              {item.alternatives.length > 0 && (
                <div>
                  <h4>Alternative vurderinger</h4>
                  <ul>
                    {item.alternatives.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Sources ids={item.sourceIds} sources={solution.sources} />
              <Button
                variant="outline"
                onClick={() => onEditQuestion(item.questionId)}
                disabled={disabled}
              >
                Arbeid videre med dette svaret
              </Button>
            </article>
          ))}
        </section>
      )}
      <p className="case-learning-note">
        KI-støttet øving, ikke sensur. Svarene sendes til nettstedets KI-tjeneste når du ber om
        tilbakemelding. Bruk fiktive pasientopplysninger.
      </p>
      <details>
        <summary>Meld fra om en mulig fagfeil</summary>
        <p>Last ned et notat du selv kan dele med faglærer eller nettstedets ansvarlige.</p>
        <label>
          Hva bør undersøkes?
          <textarea value={report} onChange={(event) => setReport(event.target.value)} />
        </label>
        <Button
          variant="outline"
          disabled={!report.trim()}
          onClick={() => {
            const blob = new Blob(
              [
                `Mulig fagfeil i MAKS790\nCase: ${definition.id}\nDato: ${new Date().toISOString()}\n\n${report}`,
              ],
              { type: "text/plain;charset=utf-8" },
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "MAKS790-fagfeil.txt";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Last ned feilnotat
        </Button>
      </details>
    </section>
  );
}
