import { ArrowLeftRight, Clock3, HeartPulse } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  CasePart,
  ContentBlock,
  LocatedQuestion,
  Measurement,
  MeasurementSet,
} from "@/lib/case-model";

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="case-prose">
      {blocks.map((block, index) => (
        <div key={index}>
          {block.title && <h3>{block.title}</h3>}
          {block.type === "paragraph" ? (
            <p>{block.text}</p>
          ) : block.type === "quote" ? (
            <blockquote>«{block.text}»</blockquote>
          ) : (
            <ul>
              {block.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function MeasurementValue({ measurement }: { measurement: Measurement | undefined }) {
  return measurement ? (
    <>
      <strong>{measurement.value}</strong>
      {measurement.unit && <span className="measurement-unit"> {measurement.unit}</span>}
      {measurement.note && <span className="measurement-note">{measurement.note}</span>}
    </>
  ) : (
    <span aria-label="Ikke oppgitt">—</span>
  );
}

export function Measurements({
  current,
  previous,
}: {
  current: MeasurementSet;
  previous?: MeasurementSet | undefined;
}) {
  const [compare, setCompare] = useState(false);
  if (!current.values.length) return null;
  const ids = [
    ...new Set([
      ...current.values.map((item) => item.id),
      ...(compare ? (previous?.values.map((item) => item.id) ?? []) : []),
    ]),
  ];
  return (
    <section className="case-measurements" aria-label="Vitalparametere">
      <div className="case-section-heading">
        <h3>
          <HeartPulse aria-hidden="true" />
          Vitalparametere
        </h3>
        {previous && (
          <Button variant="ghost" onClick={() => setCompare(!compare)} aria-pressed={compare}>
            <ArrowLeftRight aria-hidden="true" />
            {compare ? "Vis siste" : "Sammenlign"}
          </Button>
        )}
      </div>
      <Table className="case-measurements-table">
        <TableHeader>
          <TableRow>
            <TableHead>Måling</TableHead>
            {compare && previous && <TableHead>{previous.timestamp}</TableHead>}
            <TableHead>{current.timestamp}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ids.map((id) => {
            const item = current.values.find((value) => value.id === id);
            const earlier = previous?.values.find((value) => value.id === id);
            return (
              <TableRow key={id}>
                <TableCell className="measurement-label">{item?.label ?? earlier?.label}</TableCell>
                {compare && (
                  <TableCell>
                    <MeasurementValue measurement={earlier} />
                  </TableCell>
                )}
                <TableCell>
                  <MeasurementValue measurement={item} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}

export function PartSituation({
  part,
  previous,
}: {
  part: CasePart;
  previous?: MeasurementSet | undefined;
}) {
  return (
    <>
      {part.timeLabel && (
        <p className="case-time">
          <Clock3 aria-hidden="true" />
          {part.timeLabel}
        </p>
      )}
      <h2 className="case-part-heading">{part.title}</h2>
      <ContentBlocks blocks={part.content} />
      {part.measurements && (
        <Measurements key={part.id} current={part.measurements} previous={previous} />
      )}
      {part.afterMeasurements && <ContentBlocks blocks={part.afterMeasurements} />}
    </>
  );
}

export function QuestionPrompt({
  question,
  headingId,
}: {
  question: LocatedQuestion;
  headingId?: string;
}) {
  return (
    <div className="case-question-prompt">
      <p className="case-eyebrow">{question.label}</p>
      {question.groupPrompt && <p className="case-group-prompt">{question.groupPrompt}</p>}
      <h3 id={headingId}>{question.prompt}</h3>
    </div>
  );
}
