# Cases that are actually worth solving

The two cases in the app today are hand-written. Nothing generates cases yet, so
the "generic case" problem is a problem we get to design away before it exists.
This plan sets the rules that force variety, then builds a generator that must
obey them.

## What makes the Randi case good (the model to copy)

Read closely, the Randi case is strong for reasons that have nothing to do with
the diagnosis:

1. **The diagnosis is not the point.** The fracture is settled by the end of
   part two. The real case is what happens to an 78-year-old with atrial
   fibrillation, hypertension and no medication list after a long lie on a
   bathroom floor.
2. **The patient exists before the illness.** Fourth floor with a lift, a dog,
   a daughter two hours away, rollator outdoors but not indoors, "wants to
   manage on her own". Every one of those facts becomes a decision later.
3. **The situation is the obstacle.** A small cramped bathroom. Friday 15.30.
   A community unit at 02.15 with one night nurse. The constraints do the
   teaching, not the pathology.
4. **Each stage asks a different kind of question.** Part 1 is planning and
   scene safety. Part 2 is discharge safety and ethics — capacity, will,
   responsibility. Part 3 is deterioration and prioritisation.
5. **The deterioration is readable in numbers, not stated in words.** BP 150/90
   to 110/54, temp 36.0 to 38.0, GCS 14-15 to 13. The student sees it; nobody
   announces it.
6. **The information is deliberately incomplete.** No medication names, no time
   on the floor, no witness. Reasoning under uncertainty is the exam.
7. **Nothing is scored.** No NEWS2, no triage verdict, no interpretation — the
   student supplies all of that.

So "not generic" does not mean "rare disease". It means: a real person, a hard
setting, incomplete data, and a decision that could reasonably go either way.

## The variety rules

Every generated case is built from an explicit combination drawn before any
medical content is written. The combination is part of the case record, so
repeats can be detected and blocked.

**1. Case engine — what is actually being tested.** Drawn per case, never the
same as the previous two:

- Deterioration missed in a patient admitted for something else
- The obvious diagnosis is right but the disposition is wrong
- Two conditions at once, where treating one worsens the other
- Right diagnosis, wrong setting or wrong resources
- Capacity, refusal, next of kin, coercion
- Information failure: handover, medication list, language, no history
- Resource conflict: two patients, one ambulance, one bed, one nurse
- Common condition with an atypical presentation
- Atypical population: the old, the pregnant, the very obese, the
  intellectually disabled, the intoxicated, the frail
- Iatrogenic: the treatment caused this
- Uncertainty that never resolves — the case ends without a diagnosis

**2. Presentation before diagnosis.** The generator is given a symptom
(confusion, falling, fatigue, abdominal pain, shortness of breath, "not
herself", fever, nothing-is-wrong-but-family-insists), and must reason from it.
It never starts from a diagnosis and dresses it up.

**3. Hard exclusions.** A textbook-typical STEMI, sepsis, pulmonary embolism,
stroke, anaphylaxis or DKA may not be the answer to a case. They may appear as
the wrong first hypothesis, as a treated comorbidity, or in a genuinely unusual
form — never as the clean headline.

**4. Forced axes rolled independently.** Age band, sex, setting (home, nursing
home, workplace, roadside, GP office, ward, out-of-hours clinic, ferry, school,
festival), time of day and week, social situation, who called and why,
resources available, language and comprehension, degree of frailty.

**5. Anti-genericness constraints baked into the prompt.**

- Two concrete non-medical facts that change a decision later (the lift is
  broken; the son flies home tomorrow)
- At least one piece of information that is missing and stays missing
- At least one red herring that is genuinely tempting
- Vital signs that trend rather than announce; never an interpretation
- Verbatim patient or relative speech in at least one stage
- No score, no triage category, no "suspicion of X" written into the case
- No placeholder or invented precision — omit what the source would not know

**6. Novelty check against history.** Before a case is accepted, its engine,
presentation, diagnosis family, setting and patient profile are compared to
your last 20 cases. Too close, and it is regenerated.

## The two formats

**Long case — one patient, one continuous story.** You choose the number of
stages (3-6) and the starting point (home/ambulance, nursing home, GP,
out-of-hours clinic, ward, phone call). The generator writes a single arc:
the same person carried through the chain, each stage with its own time stamp,
its own constraints and 1-3 questions of a different type than the stage
before. Vitals repeat the same measurement IDs so the app's existing comparison
with the previous set keeps working. The story is written stage by stage from a
shared patient dossier so later stages stay consistent with earlier ones.

**Quick case — one situation, one hard decision.** A single part, roughly 10-15
minutes: enough detail to be real, one or two questions, and a decision point
rather than a diagnosis quiz. Same variety rules, same exclusions.

## What you get in the app

- On the landing circles: "Start eksamen" generates a long case (with a short
  setup step for stages and starting point), "Kort repetisjon" generates a
  quick case.
- Generation shows live progress, because writing a six-stage case takes a
  while.
- Every generated case is saved to your account and listed in the library
  alongside the two hand-written ones, so you can return to it.
- A "Ny variant" action regenerates with the same format but a guaranteed
  different engine and presentation.
- Your answers keep saving as they do today.

## Technical section

- Login: Supabase email/password auth with an `/auth` route and an
  authenticated area; needed because history is per-account.
- Tables: `profiles`, `generated_cases` (case JSON, format, engine,
  presentation, diagnosis family, setting, patient profile, created_at),
  `case_answers` (per question, per user). RLS scoped to `auth.uid()`, with
  explicit grants.
- Generation runs in a `createServerFn` against Lovable AI Gateway using
  `openai/gpt-6-astra` on the Responses API, streaming, with structured output
  validated against the existing `CaseDefinition` shape and `validateCase`.
- The variety combination is drawn in code (seeded random over the axis lists),
  not left to the model, and passed into the prompt as fixed constraints.
- Long cases are generated in two passes: a patient dossier and stage outline
  first, then the stages, so continuity holds across six parts.
- The novelty check is a query over the user's recent `generated_cases` rows;
  a collision triggers one regeneration with the colliding axes excluded.
- No changes to `case-model.ts` semantics; generated cases pass through
  `validateCase` before they are stored or shown.
