import type { CaseDefinition, CasePart } from "../src/lib/case-model";

const makePart = (index: number, withQuestion = true): CasePart => ({
  id: `part-${index}`,
  title: `Hendelse ${index}`,
  content: [
    {
      type: "paragraph",
      text: `Situasjonsbeskrivelse for hendelse ${index}. Dette er testinnhold for navigasjon og lesbarhet.`,
    },
  ],
  questions: withQuestion
    ? [
        {
          id: `question-${index}`,
          label: `Oppgave ${index}`,
          prompt: `Beskriv vurderingene dine for hendelse ${index}.`,
        },
      ]
    : [],
});

export const minimalCase: CaseDefinition = {
  id: "test-minimal",
  title: "Enkel case uten tilleggsinformasjon",
  parts: [makePart(1)],
};
export const groupedCase: CaseDefinition = {
  id: "test-grouped",
  title: "Én situasjon med flere oppgaver",
  parts: [
    {
      ...makePart(1),
      questions: [
        { id: "question-1", label: "Oppgave 1", prompt: "Beskriv vurderingen din." },
        {
          id: "group-2",
          label: "Oppgave 2",
          prompt: "Bruk opplysningene i situasjonen når du svarer på begge delspørsmålene.",
          subquestions: [
            { id: "question-2a", label: "Oppgave 2a", prompt: "Begrunn første valg." },
            { id: "question-2b", label: "Oppgave 2b", prompt: "Begrunn neste valg." },
          ],
        },
      ],
    },
  ],
};
export const fivePartCase: CaseDefinition = {
  id: "test-five",
  title: "Fem deler med en informasjonsdel",
  parts: [makePart(1), makePart(2, false), makePart(3), makePart(4), makePart(5)],
};
export const browserFixtures = [minimalCase, groupedCase, fivePartCase];
