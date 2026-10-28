import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import type { CaseFeedback, ModelAnswer, SourceLink } from "@/lib/case-contract";
import { allQuestions, type CaseDefinition } from "@/lib/case-model";

export type AssessAnswers = (
  answers: Record<string, string>,
  solutionViewed?: boolean,
) => Promise<{ feedback: CaseFeedback; sources: SourceLink[] }>;
export type GetModelAnswer = () => Promise<{ modelAnswer: ModelAnswer; sources: SourceLink[] }>;
const statusLabels = {
  developed: "Resonnementet er godt utviklet",
  partial: "Resonnementet kan utdypes",
  "needs-review": "Vurder dette på nytt",
  unanswered: "Ikke besvart",
};

function Sources({ ids, sources }: { ids: string[]; sources: SourceLink[] }) {
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
  answers,
  assess,
  getModelAnswer,
  onModelAnswerViewed,
  modelAnswerViewed = false,
  solutionUsed = false,
  disabled = false,
}: {
  definition: CaseDefinition;
  answers: Record<string, string>;
  assess: AssessAnswers;
  getModelAnswer?: GetModelAnswer;
  onModelAnswerViewed?: () => void;
  modelAnswerViewed?: boolean;
  solutionUsed?: boolean;
  disabled?: boolean;
}) {
  const questions = allQuestions(definition);
  const fingerprint = JSON.stringify([
    questions.map((q) => [q.id, answers[q.id] ?? ""]),
    solutionUsed,
  ]);
  const [assessment, setAssessment] = useState<{
    fingerprint: string;
    result: Awaited<ReturnType<AssessAnswers>>;
  } | null>(null);
  const [solution, setSolution] = useState<Awaited<ReturnType<GetModelAnswer>> | null>(null);
  const [busy, setBusy] = useState<"feedback" | "solution" | null>(null);
  const running = useRef(false);
  const mounted = useRef(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState("");
  const result = assessment?.fingerprint === fingerprint ? assessment.result : null;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function run(kind: "feedback" | "solution") {
    if (running.current || disabled) return;
    running.current = true;
    setBusy(kind);
    setError("");
    const submittedAnswers = { ...answers };
    const submittedFingerprint = fingerprint;
    try {
      if (kind === "feedback") {
        const response = await assess(submittedAnswers, solutionUsed);
        if (mounted.current) setAssessment({ fingerprint: submittedFingerprint, result: response });
      } else if (getModelAnswer) {
        const response = await getModelAnswer();
        if (mounted.current) {
          setSolution(response);
          onModelAnswerViewed?.();
        }
      }
    } catch (caught) {
      if (mounted.current)
        setError(caught instanceof Error ? caught.message : "Kunne ikke hente læringsstøtten.");
    } finally {
      running.current = false;
      if (mounted.current) setBusy(null);
    }
  }

  return (
    <section className="case-feedback" aria-label="Tilbakemelding og løsningsforslag">
      <p className="case-eyebrow">Arbeid videre med casen</p>
      <h2>Tilbakemelding og løsningsforslag</h2>
      <p>
        Få en samlet vurdering av svarene dine, eller se et begrunnet løsningsforslag. Du kan bruke
        begge før du fullfører.
      </p>
      <div className="case-learning-actions">
        <Button disabled={disabled || busy !== null} onClick={() => void run("feedback")}>
          {busy === "feedback"
            ? "Vurderer besvarelsen …"
            : result
              ? "Vurder svarene på nytt"
              : "Få tilbakemelding"}
        </Button>
        {getModelAnswer && (
          <Button
            variant="outline"
            disabled={disabled || busy !== null}
            onClick={() => void run("solution")}
          >
            {busy === "solution"
              ? "Henter løsningsforslag …"
              : solution || modelAnswerViewed
                ? "Vis løsningsforslaget igjen"
                : "Se løsningsforslag"}
          </Button>
        )}
      </div>
      {solutionUsed && <p className="case-solution-marker">Øvd med løsningsforslag</p>}
      {busy && (
        <p role="status">
          {busy === "feedback"
            ? "Vurderer helheten og begrunnelsene i hver oppgave. Dette kan ta noen minutter."
            : "Henter det faglige løsningsforslaget."}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {assessment && !result && (
        <p role="status">
          Svarene eller øvingsgrunnlaget er endret. Be om ny tilbakemelding på den aktuelle
          besvarelsen.
        </p>
      )}
      {result && (
        <div aria-label="Tilbakemelding på aktuell besvarelse">
          <h3>Helhetsvurdering</h3>
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
                  ["Styrker", item.strengths],
                  ["Utvikle videre", item.improvements],
                  ["Forsvarlige alternativer", item.alternatives],
                  ["Viktige hensyn", item.safety],
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
            </article>
          ))}
        </div>
      )}
      {solution && (
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
              <h4>Alternative vurderinger</h4>
              <ul>
                {item.alternatives.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
              <Sources ids={item.sourceIds} sources={solution.sources} />
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
