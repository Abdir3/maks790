import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { drawVariety, TOPICS, START_SETTINGS, type HistoryEntry } from "../src/lib/case-variety";
import { draftContract, feedbackContract, reviewContract } from "../src/lib/case-contract";
import {
  validateGenerated,
  validateFeedback,
  reviewPassed,
  caseSimilarity,
} from "../src/lib/case-quality";
import { generateValidatedCase } from "../src/lib/case-generation.server";
import { generateFeedback } from "../src/lib/case-feedback.server";
import {
  buildDefinition,
  publicDefinition,
  normaliseClinicalData,
  timelineLabel,
} from "../src/lib/generated-case";
import { openAssessment, sealAssessment } from "../src/lib/case-assessment.server";
import { withCaseOperation } from "../src/lib/case-operation.server";
import {
  readResponseJson,
  AiProviderError,
  providerErrorFromResponse,
  generateJson,
} from "../src/lib/ai-gateway.server";
import { allQuestions, parseDraft } from "../src/lib/case-model";
import {
  draw,
  generatedFixture,
  generatedDefinition,
  reviewed,
  feedbackFixture,
} from "./generator-fixtures";

describe("Curriculum coverage and real variety", () => {
  it("varies real clinical problems across a bounded production history", () => {
    const history: HistoryEntry[] = [],
      fingerprints = new Set<string>(),
      counts = new Map<string, number>();
    let seed = 17;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 120; i++) {
      const d = drawVariety(history, { startSetting: "auto", difficulty: "complex" }, random);
      assert.ok(d.diagnosisFamily && d.mechanism && d.pivotalEvidence.length >= 2);
      fingerprints.add(d.fingerprint);
      counts.set(d.topicId, (counts.get(d.topicId) ?? 0) + 1);
      history.unshift({
        engine: d.decision,
        presentation: d.topicId,
        setting: d.settingId,
        diagnosis_family: d.diagnosisFamily,
        blueprintId: d.blueprintId,
        fingerprint: d.fingerprint,
        mechanism: d.mechanism,
        reasoningTarget: d.reasoningTarget,
        pivotalFindings: d.pivotalEvidence,
      });
      history.splice(48); // Same bounded history window as the production query.
    }
    assert.equal(counts.size, TOPICS.length);
    assert.ok([...counts.values()].every((n) => n >= 5));
    assert.ok(fingerprints.size >= 50);
    assert.ok(history.every((h) => !h.diagnosis_family?.includes("|")));
  });
  it("honours every requested start and excludes children from nursing homes", () => {
    for (const s of START_SETTINGS.filter((s) => s.id !== "auto")) {
      const d = drawVariety([], { startSetting: s.id, difficulty: "advanced" }, () => 0);
      assert.equal(d.setting, s.label);
      if (s.id === "sykehjem") assert.ok(d.minAge >= 70);
      if (s.id === "kad") assert.ok(d.minAge >= 18);
    }
    assert.throws(() =>
      drawVariety([], { startSetting: "sykehjem", topic: "pediatrics", difficulty: "advanced" }),
    );
    assert.throws(() =>
      drawVariety([], { startSetting: "kad", topic: "pediatrics", difficulty: "advanced" }),
    );
  });
});
describe("Fail-closed content checks", () => {
  it("accepts a consistent multistage fixture and rejects unknown fields", () => {
    assert.ok(draftContract.validator.safeParse(generatedFixture()).success);
    assert.deepEqual(validateGenerated(generatedFixture(), draw, 3, draw.sourceIds), []);
    assert.equal(
      draftContract.validator.safeParse({ ...generatedFixture(), injected: true }).success,
      false,
    );
  });
  for (const [name, mutate] of [
    [
      "diagnosis family drift",
      (g: ReturnType<typeof generatedFixture>) => {
        g.diagnosisFamily = "akutt-koronarsyndrom";
      },
    ],
    [
      "age",
      (g: ReturnType<typeof generatedFixture>) => {
        g.ageYears = 5;
      },
    ],
    [
      "start",
      (g: ReturnType<typeof generatedFixture>) => {
        g.stages[0]!.setting = "Sykehjem";
      },
    ],
    [
      "time",
      (g: ReturnType<typeof generatedFixture>) => {
        g.stages[2]!.elapsedMinutes = 0;
      },
    ],
    [
      "blood pressure",
      (g: ReturnType<typeof generatedFixture>) => {
        g.stages[0]!.vitals[0]!.value = "70/120";
      },
    ],
    [
      "oxygen",
      (g: ReturnType<typeof generatedFixture>) => {
        g.stages[0]!.vitals[2]!.value = "105";
      },
    ],
    [
      "oxygen context",
      (g: ReturnType<typeof generatedFixture>) => {
        g.stages[0]!.vitals[2]!.note = "";
      },
    ],
    [
      "units",
      (g: ReturnType<typeof generatedFixture>) => {
        g.stages[0]!.vitals[1]!.unit = "mmHg";
      },
    ],
    [
      "source",
      (g: ReturnType<typeof generatedFixture>) => {
        g.stages[0]!.questions[0]!.rubric.sourceIds = ["made-up-guideline"];
      },
    ],
    [
      "pedagogical-only support",
      (g: ReturnType<typeof generatedFixture>) => {
        g.stages[0]!.questions[0]!.rubric.sourceIds = ["assignment-2"];
      },
    ],
    [
      "missing vital sign",
      (g: ReturnType<typeof generatedFixture>) => {
        g.stages[0]!.vitals = g.stages[0]!.vitals.filter((v) => v.id !== "temperature");
      },
    ],
    [
      "future medication",
      (g: ReturnType<typeof generatedFixture>) => {
        g.stages[0]!.medications.push({
          name: "Morfin",
          activeIngredient: "morfin",
          dose: "5 mg",
          route: "intravenøst",
          schedule: "Enkeltdose",
          context: "given",
          timeMinutes: 20,
          sourceIds: ["geriatrics"],
        });
      },
    ],
    [
      "insufficient reasoning breadth",
      (g: ReturnType<typeof generatedFixture>) => {
        g.stages[2]!.questions[0]!.skill = "assessment";
      },
    ],
  ] as const)
    it(`rejects ${name}`, () => {
      const g = generatedFixture();
      mutate(g);
      assert.ok(validateGenerated(g, draw, 3, draw.sourceIds).length);
    });
  it("requires all reviewer checks, not a majority", () => {
    assert.equal(reviewPassed(reviewed), true);
    assert.equal(reviewPassed({ ...reviewed, clinicallyPlausible: false }), false);
    assert.equal(reviewPassed({ ...reviewed, issues: ["Uavklart"] }), false);
  });
  it("checks explicit GCS components without inventing a score from prose", () => {
    const g = generatedFixture();
    const gcs = g.stages[0]!.vitals.find((v) => v.id === "gcs")!;
    for (const note of ["E4 V5 M6", "E4V5M6", "E: 4, V: 5, M: 6"]) {
      gcs.note = note;
      assert.deepEqual(validateGenerated(g, draw, 3, draw.sourceIds), []);
    }
    gcs.value = "14";
    assert.match(validateGenerated(g, draw, 3, draw.sourceIds).join(" "), /GCS-totalen/);
    gcs.note = "E4 V4 M6; våken, desorientert";
    assert.deepEqual(validateGenerated(g, draw, 3, draw.sourceIds), []);
    gcs.note = "E5 V3 M6"; // The sum alone would incorrectly pass.
    assert.match(validateGenerated(g, draw, 3, draw.sourceIds).join(" "), /E\/V\/M/);
    gcs.note = "E3.5 V4.5 M6";
    assert.match(validateGenerated(g, draw, 3, draw.sourceIds).join(" "), /E\/V\/M/);
    gcs.note = "Søvnig, åpner øynene ved tiltale og svarer orientert.";
    assert.deepEqual(validateGenerated(g, draw, 3, draw.sourceIds), []);
    gcs.note = "Merking: prøve4, rev5, rom6. Ingen numeriske GCS-delskårer oppgitt.";
    assert.deepEqual(validateGenerated(g, draw, 3, draw.sourceIds), []);
  });
  it("allows focused two- or three-question short cases but rejects four independent tasks", () => {
    const g = generatedFixture(1);
    const original = g.stages[0]!.questions[0]!;
    g.stages[0]!.questions = [
      original,
      { ...original, prompt: "Hvilken klinisk beslutning er viktigst nå, og hvorfor?" },
    ];
    assert.deepEqual(validateGenerated(g, draw, 1, draw.sourceIds), []);
    g.stages[0]!.questions.push({
      ...original,
      prompt: "Hvordan påvirker de oppgitte legemidlene vurderingen?",
    });
    assert.deepEqual(validateGenerated(g, draw, 1, draw.sourceIds), []);
    g.stages[0]!.questions.push({
      ...original,
      prompt: "Hvordan vil du planlegge pasientens videre oppfølging?",
    });
    assert.match(validateGenerated(g, draw, 1, draw.sourceIds).join(" "), /for mange spørsmål/);
  });
});
function blindFixture(id: string) {
  return {
    summary: "Tilstanden krever en samlet vurdering av akutt funksjonsendring.",
    questions: allQuestions(buildDefinition(id, generatedFixture(), draw)).map((q) => ({
      questionId: q.id,
      conclusion: "Akutt funksjonsendring trenger bred vurdering.",
      supportingFindings: ["Ny oppmerksomhetsendring"],
      alternative: "Legemiddelvirkning kan bidra dersom inntaket bekreftes.",
      clinicalConsequence: "Avklar årsak og behov for overvåking.",
      missingDecisiveData: [] as string[],
      requiresReasoning: true,
    })),
  };
}
describe("Generation orchestration", () => {
  it("does not nominate a priority child through the first triage layout", () => {
    const triageDraw = drawVariety(
      [],
      {
        startSetting: "legevakt",
        difficulty: "advanced",
        blueprintId: "child-triage",
        format: "long",
      },
      () => 0,
    );
    // A structural regression fixture, not a model-generated clinical example.
    const g = generatedFixture(3);
    g.patient = "Amir";
    g.ageYears = 4;
    g.diagnosisFamily = triageDraw.diagnosisFamily;
    g.background = ["Tre barn venter sammen med sine foreldre på legevakten."];
    g.stages[0]!.paragraphs = [
      "Amir, fire år, sitter hos mor og svarer på spørsmål. Han hoster og har drukket mindre.",
      "Liv, åtte uker, virker slapp i fars armer. Far beskriver tydelig mindre drikking.",
      "Eli, tolv år, kom etter å ha tråkket over. Hun snakker rolig med mor.",
    ];
    g.stages[0]!.clinicalFindings = [
      "Førsteinntrykket er observert av sykepleier. Vitale parametre er ennå ikke målt.",
    ];
    g.stages.forEach((stage, i) => {
      stage.setting = i ? "Legevakt – Amir" : triageDraw.setting;
      if (i) {
        stage.paragraphs = ["Amir undersøkes mens en annen sykepleier følger Liv og Eli."];
        stage.clinicalFindings = ["Amir er våken og svarer med hele setninger."];
        stage.vitals = [
          { id: "bp", value: "96/60", unit: "mmHg", note: "" },
          { id: "pulse", value: "112", unit: "/min", note: "Regelmessig" },
          { id: "respiration", value: "28", unit: "/min", note: "" },
          { id: "spo2", value: "97", unit: "%", note: "Romluft" },
          { id: "temperature", value: "38,1", unit: "°C", note: "" },
          { id: "consciousness", value: "Våken, god kontakt", unit: "", note: "" },
        ];
      }
      stage.questions[0]!.rubric.sourceIds = ["pediatrics", "assignment-1"];
    });
    g.stages[0]!.vitals = [];
    assert.deepEqual(validateGenerated(g, triageDraw, 3, triageDraw.sourceIds), []);
    const definition = buildDefinition("triage-layout", g, triageDraw);
    assert.equal(definition.patient, undefined);
    assert.equal(definition.parts[0]!.measurements!.values.length, 0);
    assert.ok(definition.parts[1]!.measurements!.values.length);
    assert.equal(publicDefinition(definition).patient, undefined);

    g.stages[0]!.vitals = [...g.stages[1]!.vitals];
    assert.match(
      validateGenerated(g, triageDraw, 3, triageDraw.sourceIds).join(" "),
      /presenterer alle barna likt/,
    );
    assert.match(
      validateGenerated(g, triageDraw, 1, triageDraw.sourceIds).join(" "),
      /trenger en langcase/,
    );
  });
  it("derives blood gas from displayed primary values and strips nested private fields", () => {
    const g = generatedFixture();
    g.stages[0]!.bloodGas = [
      {
        sampleType: "arterial",
        sampledAt: "Unreliable clock",
        oxygen: "Romluft",
        pH: 7.397,
        pCO2: 5.274,
        pO2: 11.276,
        timeMinutes: 0,
      },
    ];
    const normalised = normaliseClinicalData(g);
    assert.equal(normalised.stages[0]!.bloodGas[0]!.pH, 7.4);
    const d = buildDefinition("gas", normalised, draw);
    const group = d.parts[0].investigations![0]!;
    assert.equal(group.values.find((v) => v.id === "pco2")!.value, "5,27");
    const bicarbonate = 0.23 * 5.27 * 10 ** (7.4 - 6.095);
    assert.equal(
      group.values.find((v) => v.id === "hco3")!.value,
      bicarbonate.toFixed(1).replace(".", ","),
    );
    assert.ok(group.sourceUrl?.startsWith("https://labfag.no/"));
    const injected = JSON.parse(JSON.stringify(d));
    injected.parts[0].investigations[0].dossier = "hidden-investigation";
    injected.parts[0].questions[0].rubric = "hidden-rubric";
    injected.background[0].diagnosis = "hidden-background";
    assert.ok(!JSON.stringify(publicDefinition(injected)).includes("hidden-"));
  });
  it("uses one explicit clock for previous medication, same-time sections and results", () => {
    assert.equal(timelineLabel(-1500), "1 døgn 1 t før første vurdering");
    const g = generatedFixture();
    g.stages[1]!.elapsedMinutes = 0;
    assert.deepEqual(validateGenerated(g, draw, 3, draw.sourceIds), []);
    assert.equal(normaliseClinicalData(g).stages[1]!.timeLabel, "Ved første vurdering");
  });
  it("requires baseline vital signs without inventing new measurements for a later conversation", () => {
    const g = generatedFixture();
    g.stages[2]!.vitals = [];
    g.stages[2]!.questions[0]!.skill = "communication";
    assert.ok(draftContract.validator.safeParse(g).success);
    assert.deepEqual(validateGenerated(g, draw, 3, draw.sourceIds), []);
    g.stages[0]!.vitals = [];
    assert.ok(
      validateGenerated(g, draw, 3, draw.sourceIds).some((issue) =>
        issue.includes("Vitale parametre"),
      ),
    );
  });
  it("rejects role sentences truncated in actual model trials", () => {
    const g = generatedFixture();
    for (const role of [
      "Du er sykepleier i akuttmottaket. Alle delene gjelder samme vurdering,",
      "Du er sykepleier i akuttmottaket. Legen har ansvarer",
    ]) {
      g.role = role;
      assert.ok(
        validateGenerated(g, draw, 3, draw.sourceIds).some((issue) =>
          issue.includes("ufullført setning"),
        ),
      );
    }
  });
  it("allows clinically relevant dose history instead of suppressing the case data", () => {
    const g = generatedFixture();
    g.stages[0]!.medications = [
      {
        name: "Amlodipin",
        activeIngredient: "amlodipin",
        dose: "5 mg",
        route: "peroralt",
        schedule: "Hver morgen",
        context: "regular",
        timeMinutes: -180,
        sourceIds: ["geriatrics"],
      },
    ];
    assert.deepEqual(validateGenerated(g, draw, 3, draw.sourceIds), []);
    const d = buildDefinition("history", g, draw);
    assert.match(JSON.stringify(d), /5 mg/);
    assert.match(JSON.stringify(d), /3 t før/);
  });
  it("blocks cases whose blind solution needs missing data or only copies a label", async () => {
    for (const reason of ["missing", "copy"]) {
      let reviews = 0;
      await assert.rejects(
        generateValidatedCase({
          id: "x",
          draw,
          stages: 3,
          recent: [],
          generate: async (args) => {
            if (args.schemaName === "case_draft_v3") return generatedFixture();
            if (args.schemaName === "case_blind_v3") {
              const blind = blindFixture("x");
              if (reason === "missing")
                blind.questions[0]!.missingDecisiveData = ["Glukose som oppgaven krever."];
              else blind.questions[0]!.requiresReasoning = false;
              return blind;
            }
            reviews++;
            return reviewed;
          },
        }),
        /Ingen case er lagret/,
      );
      assert.equal(reviews, 0);
    }
  });
  it("always displays the authoritative age, even if the generated name omits it", () => {
    const g = generatedFixture(1);
    g.patient = "Liv";
    assert.equal(buildDefinition("age", g, draw).patient, "Liv, 79 år");
    g.patient = "Liv, 79 år";
    assert.equal(buildDefinition("age", g, draw).patient, "Liv, 79 år");
    g.patient = "Mia";
    g.ageYears = 0.5;
    assert.equal(buildDefinition("age", g, draw).patient, "Mia, 6 måneder");
    g.ageYears = 0.99;
    assert.equal(buildDefinition("age", g, draw).patient, "Mia, 11 måneder");
    g.ageYears = 1;
    assert.equal(buildDefinition("age", g, draw).patient, "Mia, 1 år");
    g.ageYears = 12 / 365;
    assert.equal(buildDefinition("age", g, draw).patient, "Mia, 12 dager");
    g.ageYears = 4 / (365 * 24);
    g.patient = "Mia, 4 timer";
    assert.equal(buildDefinition("age", g, draw).patient, "Mia, 4 timer");
    g.ageYears = 1 / 365;
    assert.equal(buildDefinition("age", g, draw).patient, "Mia, 1 dag");
    g.ageYears = 1 / 12;
    assert.equal(buildDefinition("age", g, draw).patient, "Mia, 1 måned");
  });
  it("reviews a complete timeline then returns only student content", async () => {
    const calls: string[] = [];
    const result = await generateValidatedCase({
      id: "gen-test",
      draw,
      stages: 3,
      recent: [],
      generate: async (args) => {
        calls.push(args.schemaName);
        args.onResponse?.({ model: "gpt-6-astra", id: `response-${calls.length}` });
        if (args.schemaName === "case_draft_v3") return generatedFixture();
        if (args.schemaName === "case_blind_v3") {
          assert.ok(!args.input.includes('"rubric"'));
          assert.ok(!args.input.includes('"diagnosisFamily"'));
          return blindFixture("gen-test");
        }
        return reviewed;
      },
    });
    assert.deepEqual(calls, ["case_draft_v3", "case_blind_v3", "case_review_v3"]);
    assert.equal(result.attempts, 1);
    assert.equal(result.assessment.modelResponses?.length, 3);
    assert.ok(
      result.assessment.modelResponses?.every((item) => item.response.model === "gpt-6-astra"),
    );
    assert.equal(allQuestions(result.definition).length, 3);
    const publicText = JSON.stringify(result.definition);
    assert.ok(!publicText.includes("dossier"));
    assert.ok(!publicText.includes("rubric"));
    assert.ok(!publicText.includes("hypoaktivt delirium"));
    assert.deepEqual(
      publicDefinition({ ...result.definition, _assessment: "private" }),
      result.definition,
    );
  });
  it("permits a justified empty alternative while still running the independent review", async () => {
    const g = generatedFixture();
    g.stages[0]!.questions[0]!.rubric.alternatives = [];
    let reviewCalls = 0;
    const result = await generateValidatedCase({
      id: "no-forced-alternative",
      draw,
      stages: 3,
      recent: [],
      generate: async (request) => {
        if (request.schemaName === "case_draft_v3") return g;
        if (request.schemaName === "case_blind_v3") {
          const solution = blindFixture("no-forced-alternative");
          solution.questions[0]!.alternative = "";
          return solution;
        }
        reviewCalls++;
        return reviewed;
      },
    });
    assert.equal(reviewCalls, 1);
    assert.deepEqual(result.assessment.generated.stages[0]!.questions[0]!.rubric.alternatives, []);
    assert.equal(result.assessment.blindSolution.questions[0]!.alternative, "");
  });
  it("retries invalid content once, then blocks without returning a case", async () => {
    let calls = 0;
    await assert.rejects(
      generateValidatedCase({
        id: "x",
        draw,
        stages: 3,
        recent: [],
        generate: async () => {
          calls++;
          const g = generatedFixture();
          g.ageYears = 1;
          return g;
        },
      }),
      /Ingen case er lagret/,
    );
    assert.equal(calls, 2);
  });
  it("repairs an initial rejection and re-reviews the replacement", async () => {
    let drafts = 0,
      reviews = 0;
    const result = await generateValidatedCase({
      id: "x",
      draw,
      stages: 3,
      recent: [],
      generate: async (args) => {
        if (args.schemaName === "case_draft_v3") {
          drafts++;
          if (drafts === 2) {
            assert.match(args.input, /Forrige forslag \(DATA/);
            assert.match(args.input, /Oppgaven er uklar/);
            assert.ok(args.input.includes(generatedFixture().patient));
          }
          return generatedFixture();
        }
        if (args.schemaName === "case_blind_v3") return blindFixture("x");
        reviews++;
        return reviews === 1
          ? { ...reviewed, fair: false, issues: ["Oppgaven er uklar."] }
          : reviewed;
      },
    });
    assert.equal(result.attempts, 2);
    assert.equal(drafts, 2);
    assert.equal(reviews, 2);
  });
  it("rejects near copies even with a new identity", async () => {
    const other = structuredClone(generatedDefinition);
    other.patient = "Et annet navn";
    assert.equal(caseSimilarity(generatedDefinition, other), 1);
    await assert.rejects(
      generateValidatedCase({
        id: "new",
        draw,
        stages: 3,
        recent: [other],
        generate: async () => generatedFixture(),
      }),
      /kvalitetskontrollen/,
    );
  });
});
describe("Feedback evidence, alternatives and question-specific temporal scope", () => {
  it("regenerates a fabricated quotation once and validates the replacement", async () => {
    const definition = buildDefinition("single", generatedFixture(1), draw);
    const id = allQuestions(definition)[0]!.id;
    const answer = "Jeg vil avklare funksjonsendringen.";
    let drafts = 0;
    const response = await generateFeedback(
      definition,
      {
        generated: generatedFixture(1),
        review: reviewed,
        sourceVersion: "test",
        sourceIds: draw.sourceIds,
        createdAt: "2026-10-27",
      },
      { [id]: answer },
      async (args) => {
        if (args.schemaName === "feedback_review_v3") return reviewed;
        drafts++;
        if (drafts === 2) assert.match(args.input, /Sitatet finnes ikke/);
        return feedbackFixture(id, drafts === 1 ? "Oppdiktet sitat" : answer);
      },
    );
    assert.equal(drafts, 2);
    assert.equal(response.questions[0]!.evidence, answer);
  });
  it("validates real quotations and does not reward an empty answer", () => {
    const def = buildDefinition("single", generatedFixture(1), draw),
      id = allQuestions(def)[0]!.id;
    const answer = "Jeg vil innhente komparentopplysninger.";
    assert.deepEqual(
      validateFeedback(feedbackFixture(id, answer), def, { [id]: answer }, draw.sourceIds),
      [],
    );
    assert.ok(
      validateFeedback(
        feedbackFixture(id, "Oppdiktet sitat"),
        def,
        { [id]: answer },
        draw.sourceIds,
      ).length,
    );
    assert.deepEqual(validateFeedback(feedbackFixture(id, ""), def, {}, draw.sourceIds), []);
    assert.ok(validateFeedback(feedbackFixture(id, answer), def, {}, draw.sourceIds).length);
    const noAlternativeNeeded = feedbackFixture(id, answer);
    noAlternativeNeeded.questions[0]!.alternatives = [];
    assert.ok(feedbackContract.validator.safeParse(noAlternativeNeeded).success);
    assert.deepEqual(
      validateFeedback(noAlternativeNeeded, def, { [id]: answer }, draw.sourceIds),
      [],
    );
  });
  it("assesses the whole submission with time-bounded information for each question", async () => {
    const generated = generatedFixture();
    generated.stages[0]!.questions[0]!.temporalScope = "at-time";
    generated.stages[1]!.questions[0]!.temporalScope = "whole-case";
    const definition = buildDefinition("scope", generated, draw);
    const ids = allQuestions(definition).map((q) => q.id);
    const answers = Object.fromEntries(ids.map((id, i) => [id, `Mitt svar på del ${i + 1}.`]));
    let feedbackCalls = 0;
    const response = await generateFeedback(
      definition,
      {
        generated,
        review: reviewed,
        sourceVersion: "test",
        sourceIds: draw.sourceIds,
        createdAt: "2026-10-27",
      },
      answers,
      async (args) => {
        if (args.schemaName === "case_feedback_v3") {
          feedbackCalls++;
          const input = JSON.parse(args.input);
          assert.deepEqual(input.answers, answers);
          assert.equal(input.tasks[0].temporalScope, "at-time");
          assert.equal(input.tasks[0].availableInformation.parts.length, 1);
          assert.equal(input.tasks[1].temporalScope, "whole-case");
          assert.equal(input.tasks[1].availableInformation.parts.length, 3);
          return {
            summary:
              "Vurderingen kobler sammen sykdom, funksjon og videre oppfølging i hele forløpet.",
            questions: ids.map((id) => feedbackFixture(id, answers[id]).questions[0]!),
          };
        }
        return reviewed;
      },
    );
    assert.equal(response.questions.length, 3);
    assert.equal(feedbackCalls, 1);
  });
  it("rejects feedback when the safety reviewer dissents", async () => {
    const definition = buildDefinition("single", generatedFixture(1), draw);
    const id = allQuestions(definition)[0]!.id;
    await assert.rejects(
      generateFeedback(
        definition,
        {
          generated: generatedFixture(1),
          review: reviewed,
          sourceVersion: "test",
          sourceIds: draw.sourceIds,
          createdAt: "2026-10-27",
        },
        { [id]: "Jeg vil vurdere pasientens funksjon." },
        async (args) =>
          args.schemaName === "case_feedback_v3"
            ? feedbackFixture(id, "Jeg vil vurdere pasientens funksjon.")
            : { ...reviewed, noUnsupportedHighRiskAdvice: false },
      ),
      /usikkerheter/,
    );
  });
  it("allows relevant numerical medication history and exact student quotations", () => {
    const def = buildDefinition("single", generatedFixture(1), draw);
    const id = allQuestions(def)[0]!.id;
    const answer = "Pasienten fikk 5 mg morfin etter at forvirringen hadde begynt.";
    const feedback = feedbackFixture(id, answer);
    feedback.questions[0]!.strengths = [];
    feedback.questions[0]!.safety = [
      "Tidsrekkefølgen må vurderes sammen med endring i bevissthet og respirasjon.",
    ];
    assert.deepEqual(validateFeedback(feedback, def, { [id]: answer }, draw.sourceIds), []);
    feedback.questions[0]!.improvements = [
      "Drøft om de allerede gitte 5 mg morfin kan ha bidratt til senere endring.",
    ];
    assert.deepEqual(validateFeedback(feedback, def, { [id]: answer }, draw.sourceIds), []);
  });
});
describe("Assessment integrity and operation isolation", () => {
  const secret = "test-only-key-with-at-least-32-characters";
  it("binds encrypted rubric to owner and exact case, tolerating JSONB key reordering", async () => {
    const sealed = await sealAssessment(
      { diagnosis: "private" },
      "owner",
      generatedDefinition,
      secret,
    );
    assert.ok(!sealed.includes("private"));
    const reordered = Object.fromEntries(Object.entries(generatedDefinition).reverse());
    assert.deepEqual(await openAssessment(sealed, "owner", reordered, secret), {
      diagnosis: "private",
    });
    await assert.rejects(openAssessment(sealed, "other-owner", generatedDefinition, secret));
    await assert.rejects(
      openAssessment(sealed, "owner", { ...generatedDefinition, title: "tampered" }, secret),
    );
    await assert.rejects(
      openAssessment(sealed.slice(0, -4) + "AAAA", "owner", generatedDefinition, secret),
    );
    await assert.rejects(
      openAssessment(sealed, "owner", generatedDefinition, "different-secret-with-32-characters"),
    );
  });
  it("rejects duplicate requests and releases the lock after failure", async () => {
    await assert.rejects(
      withCaseOperation("user", async () => {
        await assert.rejects(withCaseOperation("user", async () => true));
        throw new Error("failure");
      }),
    );
    assert.equal(await withCaseOperation("user", async () => true), true);
  });
  it("clamps corrupt reveal state and preserves old drafts", () => {
    const draft = {
      version: 1,
      answers: {},
      partId: generatedDefinition.parts[0].id,
      unlockedParts: 999,
    };
    assert.equal(parseDraft(JSON.stringify(draft), generatedDefinition).unlockedParts, 3);
    assert.equal(
      parseDraft(JSON.stringify({ ...draft, unlockedParts: -2 }), generatedDefinition)
        .unlockedParts,
      1,
    );
  });
});
describe("Responses stream completion", () => {
  it("normalises transport failures without exposing connection details", async () => {
    const originalFetch = globalThis.fetch;
    const originalKey = process.env["LOVABLE_API_KEY"];
    process.env["LOVABLE_API_KEY"] = "local-test-placeholder";
    try {
      for (const [failure, expected] of [
        [new Error("private upstream connection detail"), "unavailable"],
        [new TypeError("private fetch detail"), "unavailable"],
        [{ message: "private non-Error failure" }, "unavailable"],
        [new DOMException("private timeout detail", "TimeoutError"), "timeout"],
        [new DOMException("private abort detail", "AbortError"), "timeout"],
        [new AiProviderError("credits-exhausted"), "credits-exhausted"],
      ] as const) {
        globalThis.fetch = (async () => {
          throw failure;
        }) as typeof fetch;
        await assert.rejects(
          generateJson({ instructions: "test", input: "test", schemaName: "test", schema: {} }),
          (error: unknown) => {
            assert.ok(error instanceof AiProviderError);
            assert.equal(error.code, expected);
            assert.ok(!error.message.includes("private"));
            return true;
          },
        );
      }
    } finally {
      globalThis.fetch = originalFetch;
      if (originalKey === undefined) delete process.env["LOVABLE_API_KEY"];
      else process.env["LOVABLE_API_KEY"] = originalKey;
    }
  });
  const stream = (s: string) =>
    new ReadableStream<Uint8Array>({
      start(c) {
        const bytes = new TextEncoder().encode(s);
        for (let i = 0; i < bytes.length; i += 3) c.enqueue(bytes.slice(i, i + 3));
        c.close();
      },
    });
  it("handles UTF-8 chunks and a completed event without trailing newline", async () => {
    const body = `data: ${JSON.stringify({ type: "response.output_text.delta", delta: '{"text":"øving"}' })}\n\ndata: ${JSON.stringify({ type: "response.completed", response: { status: "completed" } })}`;
    assert.deepEqual(await readResponseJson(stream(body)), { text: "øving" });
  });
  it("records provider model and usage without copying private response fields", async () => {
    const response = {
      status: "completed",
      id: "resp-test",
      model: "gpt-6-astra",
      output_text: '{"ok":true}',
      instructions: "private instructions",
      metadata: { secret: "no" },
      usage: {
        input_tokens: 200,
        output_tokens: 50,
        output_tokens_details: { reasoning_tokens: 20 },
      },
    };
    const observed: unknown[] = [];
    const result = await readResponseJson(
      stream(`data: ${JSON.stringify({ type: "response.completed", response })}\n`),
      (metadata) => observed.push(metadata),
    );
    assert.deepEqual(result, { ok: true });
    assert.deepEqual(observed, [
      {
        id: "resp-test",
        model: "gpt-6-astra",
        inputTokens: 200,
        outputTokens: 50,
        reasoningTokens: 20,
      },
    ]);
  });
  it("rejects truncated, failed and incomplete streams", async () => {
    await assert.rejects(
      readResponseJson(stream('data: {"type":"response.output_text.delta","delta":"{}"}\n')),
    );
    for (const type of ["response.failed", "response.incomplete", "error"])
      await assert.rejects(readResponseJson(stream(`data: ${JSON.stringify({ type })}\n`)));
  });
  it("recognises exhausted credit inside HTTP-success streams without exposing provider text", async () => {
    for (const [event, code] of [
      [
        { type: "error", code: "credit_balance_exhausted", message: "private provider detail" },
        "credits-exhausted",
      ],
      [
        {
          type: "response.failed",
          response: { error: { code: "insufficient_quota", message: "private provider detail" } },
        },
        "usage-limited",
      ],
    ] as const) {
      await assert.rejects(
        readResponseJson(stream(`data: ${JSON.stringify(event)}\n`)),
        (error: unknown) => {
          assert.ok(error instanceof AiProviderError);
          assert.equal(error.code, code);
          assert.ok(!error.message.includes("private"));
          return true;
        },
      );
    }
  });
  it("does not expose generated text from malformed JSON", async () => {
    const event = {
      type: "response.completed",
      response: { status: "completed", output_text: '{"private_diagnosis":"secret answer" BROKEN' },
    };
    await assert.rejects(
      readResponseJson(stream(`data: ${JSON.stringify(event)}\n`)),
      (error: unknown) => {
        assert.ok(error instanceof AiProviderError);
        assert.equal(error.code, "unavailable");
        assert.ok(
          !error.message.includes("secret") && !error.message.includes("private_diagnosis"),
        );
        return true;
      },
    );
  });
  it("distinguishes billing from retryable HTTP 429 and bounds untrusted error bodies", async () => {
    for (const [providerCode, expected] of [
      ["credit_balance_exhausted", "credits-exhausted"],
      ["project_spend_limit_exceeded", "usage-limited"],
      ["organization_spend_limit_exceeded", "usage-limited"],
      ["organization_usage_limit_exceeded", "usage-limited"],
      ["insufficient_quota", "usage-limited"],
      ["rate_limit_exceeded", "rate-limited"],
      ["slow_down", "rate-limited"],
    ] as const) {
      const error = await providerErrorFromResponse(
        new Response(
          JSON.stringify({ error: { code: providerCode, message: "private provider detail" } }),
          { status: 429 },
        ),
      );
      assert.equal(error.code, expected);
      assert.ok(!error.message.includes("private"));
    }
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("private".repeat(3000)));
      },
      cancel() {
        cancelled = true;
      },
    });
    const oversized = await providerErrorFromResponse(new Response(body, { status: 503 }));
    assert.equal(oversized.code, "unavailable");
    assert.equal(cancelled, true);
    assert.equal(
      (await providerErrorFromResponse(new Response("private html", { status: 401 }))).code,
      "authentication",
    );
  });
});
