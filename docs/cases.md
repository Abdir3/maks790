# Case workspace

The case library lives in `src/data/cases.ts`. The situation view, full reader,
question navigation, progress and answer summary all use this same data.

## Adding a case

Create a `CaseDefinition`, pass it through `validateCase`, and add it to `cases`.
Use stable, unique case, part and question IDs: local drafts are keyed by these
IDs. Renaming labels is safe; changing IDs creates a new draft or answer field.

- `parts` contains one or more situations, in reading order.
- A part can have any number of `questions`, including none for information-only
  parts. The case as a whole must have at least one answerable question.
- A normal question has an ID, label and prompt. A question with `subquestions`
  is an instruction group; only its child questions get answer fields.
- `background`, patient details, specialty, time labels and measurements are
  optional. Omit missing data instead of adding placeholders or invented values.
- `content` supports paragraphs, quotations and lists. `afterMeasurements`
  preserves narrative that follows measurements in the source material.
- Match measurement IDs across parts to compare them. The interface displays
  actual values and timestamps from the closest earlier set; it calculates no
  clinical scores or interpretations.

One part hides the part navigator; two or three use buttons; four or more use a
picker. All parts are accessible from the beginning. Progress counts nonblank
answers to leaf questions, not the number of parts visited.

## Drafts and completion

Drafts are saved in localStorage per case on the current browser/device, with
separate answers per question, current part/tab and completion state. There is
no account sync. Corrupt records are preserved until the user explicitly starts
a new draft. A failed write leaves the current text in memory and displays a
warning. Completing shows a read-only collection of answers, with no automatic
assessment. Starting again asks before replacing that case's saved answers.

Dictation retains the existing transcription service and its server-side
`ELEVENLABS_API_KEY` configuration. An in-flight recording remains attached to
the question where it started. Typed text stays editable while transcribing.

## Verification

- `bun test` checks dynamic structure, leaf counts, navigation, actual measurement
  comparison, ID validation and draft recovery.
- `bun run test:ui`, then open
  `http://127.0.0.1:5174/tests/case-harness.html`, provides single-part,
  grouped-question and five-part fixtures (including an information-only part).
- Harness controls simulate 200% text and storage write failure. Microphone and
  transcription are fake in this harness; they never access real audio or an
  external service. This tests target-question binding, not real recognition.
- The harness is a separate Vite configuration and is not imported by the app.
  Test fixtures and service stubs must remain outside production imports.

Browser acceptance checks: 360/390/430px mobile and desktop; enlarged text;
reduced viewport height while typing; reader open/close, remembered scroll and
answer jumps; separate subquestion drafts after reload; completion after reload;
recording while navigating to another question; storage failure and recovery.
A reduced desktop-browser viewport is not a physical-device keyboard test.

Build and push through the existing GitHub/Lovable workflow. A repository push
updates the editor; publishing the live Lovable site is a separate step.
