import { useRef, useState } from "react";
import { Button } from "./ui/button";
import type { CaseFeedback, SourceLink } from "@/lib/case-contract";
import { allQuestions, type CaseDefinition } from "@/lib/case-model";
export type AssessAnswers = (
  answers: Record<string, string>,
) => Promise<{ feedback: CaseFeedback; sources: SourceLink[] }>;
const statusLabels = {
  developed: "Resonnementet er godt utviklet",
  partial: "Resonnementet kan utdypes",
  "needs-review": "Vurder dette på nytt",
  unanswered: "Ikke besvart",
};
export function CaseFeedbackPanel({
  definition,
  answers,
  assess,
}: {
  definition: CaseDefinition;
  answers: Record<string, string>;
  assess: AssessAnswers;
}) {
  const [result, setResult] = useState<Awaited<ReturnType<AssessAnswers>> | null>(null);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState("");
  async function run() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      setResult(await assess(answers));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Kunne ikke hente tilbakemelding.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="case-feedback" aria-label="Faglig tilbakemelding">
      <p className="case-eyebrow">Tilbakemelding til øving</p>
      <h2>Utvikle resonnementet ditt</h2>
      <p>
        KI-tilbakemeldingen kan inneholde feil. Den er ikke sensur eller klinisk godkjenning.
        Svarene sendes til nettstedets KI-tjeneste når du ber om tilbakemelding; bruk bare fiktive
        pasientopplysninger.
      </p>
      {!result && (
        <Button disabled={busy} onClick={() => void run()}>
          {busy ? "Vurderer besvarelsen …" : "Få faglig tilbakemelding"}
        </Button>
      )}
      {busy && (
        <p role="status">
          Hver del vurderes med opplysningene som var tilgjengelige da. Dette kan ta flere minutter.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <p>{result.feedback.summary}</p>
          {result.feedback.questions.map((item) => (
            <article className="case-feedback-item" key={item.questionId}>
              <h3>
                {allQuestions(definition).find((q) => q.id === item.questionId)?.label} ·{" "}
                {statusLabels[item.status]}
              </h3>
              {item.evidence && <blockquote>«{item.evidence}»</blockquote>}
              {(
                [
                  ["Styrker", item.strengths],
                  ["Utvikle videre", item.improvements],
                  ["Forsvarlige alternativer", item.alternatives],
                  ["Sikkerhet og forbehold", item.safety],
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
              <details>
                <summary>Kildegrunnlag og avgrensning</summary>
                {item.sourceIds.map((id) => {
                  const source = result.sources.find((s) => s.id === id);
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
            </article>
          ))}
        </>
      )}
      <details>
        <summary>Meld fra om en mulig fagfeil</summary>
        <p>
          Lag et notat du kan dele med faglærer eller nettstedets ansvarlige. Det sendes ikke
          automatisk.
        </p>
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
