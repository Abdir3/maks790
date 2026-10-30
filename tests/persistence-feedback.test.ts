import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import {
  loadOwnedAssessment,
  loadCaseHistory,
  saveCaseWithAssessment,
} from "../src/lib/case-persistence.server";
import {
  assessmentContext,
  generateFeedback,
  generateModelAnswer,
} from "../src/lib/case-feedback.server";
import type { Assessment, JsonGenerator } from "../src/lib/case-generation.server";
import type { CaseFeedback, GeneratedCase, ModelAnswer } from "../src/lib/case-contract";
import { buildDefinition } from "../src/lib/generated-case";
import { allQuestions } from "../src/lib/case-model";
import { drawVariety } from "../src/lib/case-variety";
import { SOURCE_VERSION } from "../src/lib/case-sources.server";

const id = "00000000-0000-4000-8000-000000000001";
const owner = "00000000-0000-4000-8000-000000000002";
const stranger = "00000000-0000-4000-8000-000000000003";
const review = {
  coherent: true,
  clinicallyPlausible: true,
  fair: true,
  noDiagnosticLeak: true,
  sourcesWithinScope: true,
  matchesBlueprint: true,
  meaningfullyDifferent: true,
  rubricAcceptsAlternatives: true,
  noUnsupportedHighRiskAdvice: true,
  issues: [],
};

function fixture() {
  const draw = drawVariety(
    [],
    {
      startSetting: "legevakt",
      topic: "geriatrics",
      difficulty: "complex",
    },
    () => 0,
  );
  const generated: GeneratedCase = {
    patient: "Liv, 79 år",
    ageYears: 79,
    role: "Du er sykepleier på legevakt.",
    background: ["Liv er vanligvis selvhjulpen og bor alene. Datteren bor langt unna."],
    diagnosisFamily: "privat-diagnose",
    diagnosisAliases: ["privat-diagnose"],
    mechanism: "Infeksjon og lavt væskeinntak virker sammen.",
    presentation: "Ny oppmerksomhetssvikt og redusert matlyst.",
    reasoningTarget: "Vurdere akutt sykdom sammen med trygg overgang til hjemmet.",
    pivotalFindings: [
      "Endringen er akutt sammenlignet med vanlig funksjon.",
      "Tilstanden forverres under observasjon.",
    ],
    dossier:
      "Dette er et privat vurderingsgrunnlag med diagnostisk forklaring som ikke skal sendes til studenten før løsning åpnes.",
    stages: Array.from({ length: 3 }, (_, index) => ({
      setting: index === 0 ? "Legevakt" : "Akuttmottak",
      elapsedMinutes: index * 90,
      timeLabel: `Etter ${index * 90} minutter`,
      paragraphs: [
        index === 0
          ? "Liv svarer langsomt og har drukket lite."
          : `Ny informasjon i del ${index + 1}: hun trenger mer hjelp og er mer sløv.`,
      ],
      clinicalFindings: ["Oppmerksomheten er redusert sammenlignet med vanlig funksjon."],
      medications: [],
      laboratory: [],
      bloodGas: [],
      reports: [],
      vitals: [
        { id: "bp", value: "118/70", unit: "mmHg", note: "" },
        { id: "pulse", value: "96", unit: "/min", note: "" },
        { id: "respiration", value: "22", unit: "/min", note: "" },
        { id: "spo2", value: "94", unit: "%", note: "Romluft" },
        { id: "temperature", value: "38.2", unit: "°C", note: "" },
        { id: "gcs", value: "14", unit: "", note: "" },
      ],
      questions: [
        {
          prompt:
            index === 1
              ? "Drøft sykdom, funksjon og overgang til hjemmet i lys av hele forløpet."
              : `Hva vil du undersøke og prioritere i del ${index + 1}, basert på opplysningene da?`,
          skill: index === 1 ? "disposition" : "assessment",
          temporalScope: index === 1 ? "whole-case" : "at-time",
          rubric: {
            expected: [
              "Sammenlign akutt endring med tidligere funksjon.",
              "Begrunn hvordan funnene påvirker videre vurdering.",
            ],
            alternatives: [
              "Videre observasjon kan forsvares med konkret ansvar og mulighet for rask ny vurdering.",
            ],
            critical: ["Uavklart akutt endring må ikke avskrives som normal aldring."],
            sourceIds: ["assignment-2", "geriatrics"],
          },
        },
      ],
    })),
  };
  const assessment: Assessment = {
    generated,
    review,
    sourceIds: ["assignment-2", "geriatrics"],
    sourceVersion: SOURCE_VERSION,
    createdAt: "2026-10-28T06:00:00.000Z",
  };
  const definition = buildDefinition(`gen-${id}`, generated, draw);
  const semantic = {
    topicId: draw.topicId,
    blueprintId: draw.blueprintId,
    pattern: draw.pattern,
    decision: draw.decision,
    trajectory: draw.trajectory,
    fingerprint: draw.fingerprint,
    settingId: draw.settingId,
    diagnosisFamily: generated.diagnosisFamily,
    mechanism: generated.mechanism,
    presentation: generated.presentation,
    reasoningTarget: generated.reasoningTarget,
    pivotalFindings: generated.pivotalFindings,
  };
  return { draw, generated, assessment, definition, semantic };
}

type Result = { data: unknown; error: unknown };
function fakeClient(results: Result[]) {
  const calls: { method: string; args: unknown[] }[] = [];
  let index = 0;
  const query: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order", "limit", "in"]) {
    query[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return query;
    };
  }
  query["maybeSingle"] = () => {
    calls.push({ method: "maybeSingle", args: [] });
    return Promise.resolve(results[index++]);
  };
  query["then"] = (resolve: (value: Result) => unknown) =>
    Promise.resolve(results[index++]!).then(resolve);
  const client = {
    from: (...args: unknown[]) => {
      calls.push({ method: "from", args });
      return query;
    },
    rpc: (...args: unknown[]) => {
      calls.push({ method: "rpc", args });
      return Promise.resolve(results[index++]);
    },
  };
  return { client: client as unknown as Parameters<typeof loadOwnedAssessment>[0], calls };
}

describe("Private assessment persistence", () => {
  it("saves and reloads automatic validation without inventing an independent review", async () => {
    const f = fixture();
    delete f.assessment.review;
    f.assessment.validationMode = "automatic";
    const writer = fakeClient([{ data: null, error: null }]);
    await saveCaseWithAssessment(writer.client, { ...f, id, userId: owner, format: "long" });
    const user = fakeClient([
      { data: { id, user_id: owner, definition: f.definition }, error: null },
    ]);
    const admin = fakeClient([
      {
        data: {
          case_id: id,
          user_id: owner,
          version: 3,
          definition: f.definition,
          assessment: f.assessment,
        },
        error: null,
      },
    ]);
    const loaded = await loadOwnedAssessment(user.client, admin.client, owner, id);
    assert.deepEqual(loaded.assessment, f.assessment);
    assert.equal(assessmentContext(loaded.definition, loaded.assessment).tasks.length, 3);
    delete f.assessment.validationMode;
    await assert.rejects(
      saveCaseWithAssessment(writer.client, { ...f, id, userId: owner, format: "long" }),
    );
    assert.equal(writer.calls.length, 1);
  });
  it("saves via one atomic RPC with the diagnostic basis separate from student content", async () => {
    const f = fixture();
    const admin = fakeClient([{ data: null, error: null }]);
    await saveCaseWithAssessment(admin.client, { ...f, id, userId: owner, format: "long" });
    assert.equal(admin.calls.length, 1);
    assert.equal(admin.calls[0]!.method, "rpc");
    const [name, payload] = admin.calls[0]!.args as [string, Record<string, unknown>];
    assert.equal(name, "create_case_with_assessment");
    assert.equal(payload["p_user_id"], owner);
    assert.ok(!JSON.stringify(payload["p_definition"]).includes("privat-diagnose"));
    assert.ok(!JSON.stringify(payload["p_definition"]).includes("rubric"));
    assert.equal((payload["p_semantic"] as typeof f.semantic).diagnosisFamily, "privat-diagnose");
    assert.deepEqual(payload["p_assessment"], f.assessment);
  });

  it("never reads the privileged store before ownership is confirmed", async () => {
    const user = fakeClient([{ data: null, error: null }]);
    const admin = fakeClient([]);
    await assert.rejects(loadOwnedAssessment(user.client, admin.client, owner, id), /tilhører deg/);
    assert.equal(admin.calls.length, 0);
    assert.ok(
      user.calls.some(
        (call) => call.method === "eq" && call.args[0] === "user_id" && call.args[1] === owner,
      ),
    );
  });

  it("rejects a mismatched private owner even when the privileged connection returns it", async () => {
    const f = fixture();
    const user = fakeClient([
      { data: { id, user_id: owner, definition: f.definition }, error: null },
    ]);
    const admin = fakeClient([
      {
        data: {
          case_id: id,
          user_id: stranger,
          version: 3,
          definition: f.definition,
          assessment: f.assessment,
        },
        error: null,
      },
    ]);
    await assert.rejects(
      loadOwnedAssessment(user.client, admin.client, owner, id),
      /ikke tilgjengelig/,
    );
    assert.ok(
      admin.calls.some(
        (call) => call.method === "eq" && call.args[0] === "user_id" && call.args[1] === owner,
      ),
    );
  });

  it("verifies the immutable student definition and current assessment version", async () => {
    const f = fixture();
    f.assessment.blindSolution = {
      summary: "Den uavhengige løsningen knytter endret oppmerksomhet til klinisk utvikling.",
      questions: allQuestions(f.definition).map((question) => ({
        questionId: question.id,
        conclusion: "Vurder den akutte endringen mot tidligere funksjon.",
        supportingFindings: ["Familien beskriver en akutt endring."],
        alternative: "Observasjon med rask revurdering kan være forsvarlig.",
        clinicalConsequence: "Avklar hvem som har ansvar for videre vurdering.",
        missingDecisiveData: [],
        requiresReasoning: true,
      })),
    };
    const run = (definition = f.definition, assessment: unknown = f.assessment) => {
      const user = fakeClient([{ data: { id, user_id: owner, definition }, error: null }]);
      const admin = fakeClient([
        {
          data: { case_id: id, user_id: owner, version: 3, definition: f.definition, assessment },
          error: null,
        },
      ]);
      return loadOwnedAssessment(user.client, admin.client, owner, id);
    };
    assert.deepEqual((await run()).assessment, f.assessment);
    await assert.rejects(run({ ...f.definition, title: "Changed case" }), /samsvarer ikke/);
    await assert.rejects(
      run(f.definition, { ...f.assessment, sourceVersion: "old" }),
      /eldre eller ugyldig/,
    );
  });

  it("leaves legacy cases usable without reconstructing their answer key", async () => {
    const f = fixture();
    f.definition.practice!.version = 2;
    const user = fakeClient([
      { data: { id, user_id: owner, definition: f.definition }, error: null },
    ]);
    const admin = fakeClient([]);
    await assert.rejects(
      loadOwnedAssessment(user.client, admin.client, owner, id),
      /eldre casen kan fortsatt brukes/,
    );
    assert.equal(admin.calls.length, 0);
  });

  it("uses private actual diagnosis and evidence for history, not public labels", async () => {
    const f = fixture();
    const user = fakeClient([
      { data: [{ id, user_id: owner, definition: f.definition }], error: null },
    ]);
    const admin = fakeClient([
      { data: [{ case_id: id, user_id: owner, version: 3, semantic: f.semantic }], error: null },
    ]);
    const result = await loadCaseHistory(user.client, admin.client, owner);
    assert.equal(result.history[0]!.diagnosis_family, f.generated.diagnosisFamily);
    assert.equal(result.history[0]!.fingerprint, f.draw.fingerprint);
    assert.deepEqual(result.history[0]!.pivotalFindings, f.generated.pivotalFindings);
    assert.deepEqual(result.recent, [f.definition]);
  });
});

function feedbackFor(
  definition: ReturnType<typeof fixture>["definition"],
  answers: Record<string, string>,
): CaseFeedback {
  return {
    summary: "Du kobler utviklingen i kliniske funn til funksjon og behovet for videre oppfølging.",
    questions: allQuestions(definition).map((question) => ({
      questionId: question.id,
      status: answers[question.id] ? "partial" : "unanswered",
      evidence: answers[question.id] ?? "",
      strengths: answers[question.id]
        ? ["Du begrunner behovet for å sammenligne med vanlig funksjon."]
        : [],
      improvements: ["Beskriv hvilke nye funn som ville endret planen."],
      alternatives: [
        "Observasjon kan være forsvarlig med avtalt ansvar og rask tilgang til ny vurdering.",
      ],
      safety: [],
      nextStep: "Knytt ett konkret funn til et begrunnet neste tiltak.",
      sourceIds: ["assignment-2", "geriatrics"],
    })),
  };
}

describe("Whole-submission feedback and model answer", () => {
  it("includes other perspectives at the same time but excludes later clinical findings", () => {
    const f = fixture();
    f.assessment.generated.stages[1]!.elapsedMinutes = 0;
    const context = assessmentContext(f.definition, f.assessment);
    assert.equal(context.tasks[0]!.availableInformation.parts.length, 2);
    assert.deepEqual(
      context.tasks[0]!.availableInformation.parts.map((part) => part.id),
      f.definition.parts.slice(0, 2).map((part) => part.id),
    );
  });
  it("retains whole-case integration and the earlier question's time boundary", () => {
    const f = fixture();
    const context = assessmentContext(f.definition, f.assessment);
    assert.equal(context.tasks.length, 3);
    assert.equal(context.tasks[0]!.temporalScope, "at-time");
    assert.equal(context.tasks[0]!.availableInformation.parts.length, 1);
    assert.equal(context.tasks[1]!.temporalScope, "whole-case");
    assert.equal(context.tasks[1]!.availableInformation.parts.length, 3);
    assert.equal(context.submissionScope, "integrated-exam");
  });

  it("evaluates all answers together with exact quotations and solution-view context", async () => {
    const f = fixture();
    const answers = Object.fromEntries(
      allQuestions(f.definition).map((question, index) => [
        question.id,
        index === 2 ? "" : "Jeg vil sammenligne med tidligere funksjon.",
      ]),
    );
    const expected = feedbackFor(f.definition, answers);
    const requests: Parameters<JsonGenerator>[0][] = [];
    const result = await generateFeedback(
      f.definition,
      f.assessment,
      answers,
      async (request) => {
        requests.push(request);
        return request.schemaName === "case_feedback_v3" ? expected : review;
      },
      { solutionViewed: true },
    );
    assert.deepEqual(result, expected);
    assert.equal(requests.length, 2); // One complete result and one review, not one pair per stage.
    const input = JSON.parse(requests[0]!.input);
    assert.deepEqual(input.answers, answers);
    assert.equal(input.solutionViewed, true);
    assert.equal(input.tasks.length, 3);
    assert.equal(result.questions[2]!.status, "unanswered");
  });

  it("repairs invented quotations and fails closed if they remain unsupported", async () => {
    const f = fixture();
    const answers = Object.fromEntries(
      allQuestions(f.definition).map((q) => [q.id, "Jeg vil vurdere funksjonen."]),
    );
    const wrong = feedbackFor(f.definition, answers);
    wrong.questions[0]!.evidence = "Dette skrev studenten aldri.";
    let attempts = 0;
    await assert.rejects(
      generateFeedback(f.definition, f.assessment, answers, async (request) => {
        attempts++;
        assert.equal(request.schemaName, "case_feedback_v3");
        if (attempts === 2) assert.match(request.input, /Sitatet finnes ikke/);
        return wrong;
      }),
      /Besvarelsen din er beholdt/,
    );
    assert.equal(attempts, 2);
  });

  it("makes the model answer from the same private tasks without requiring student answers", async () => {
    const f = fixture();
    const expected: ModelAnswer = {
      summary:
        "Den akutte endringen må vurderes sammen med tidligere funksjon og utviklingen under observasjon.",
      questions: allQuestions(f.definition).map((q) => ({
        questionId: q.id,
        explanation:
          "En begrunnet vurdering kobler endret oppmerksomhet til baseline, kliniske observasjoner og mulighet for forsvarlig oppfølging.",
        keyFindings: ["Dette er en akutt endring fra tidligere funksjon."],
        alternatives: [
          "Observasjon er et alternativ dersom kompetanse og rask revurdering er tilgjengelig.",
        ],
        sourceIds: ["assignment-2", "geriatrics"],
      })),
    };
    const requests: Parameters<JsonGenerator>[0][] = [];
    const answer = await generateModelAnswer(f.definition, f.assessment, async (request) => {
      requests.push(request);
      return request.schemaName === "case_model_answer_v3" ? expected : review;
    });
    assert.deepEqual(answer, expected);
    assert.deepEqual(
      JSON.parse(requests[0]!.input).tasks,
      assessmentContext(f.definition, f.assessment).tasks,
    );
    assert.equal("answers" in JSON.parse(requests[0]!.input), false);
  });
});

// Optional isolated PostgreSQL test; no project dependency or remote database.
// Set PGLITE_TEST_MODULE to an installed @electric-sql/pglite package directory.
it(
  "executes the migration with real PostgreSQL privileges, atomicity and legacy data",
  {
    skip: !process.env["PGLITE_TEST_MODULE"],
  },
  async () => {
    const require = createRequire(import.meta.url);
    const { PGlite } = require(process.env["PGLITE_TEST_MODULE"]!);
    const db = new PGlite();
    const f = fixture();
    const migrationRoot = new URL("../supabase/migrations/", import.meta.url);
    try {
      await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id UUID PRIMARY KEY, raw_user_meta_data JSONB);
      CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE SQL STABLE AS
        $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated, service_role;
    `);
      await db.exec(
        await readFile(
          new URL("20260923172556_fde6b76e-89cf-42e9-8c01-1b31254d84c9.sql", migrationRoot),
          "utf8",
        ),
      );
      await db.query("INSERT INTO auth.users (id) VALUES ($1), ($2)", [owner, stranger]);
      const legacy = {
        ...f.definition,
        practice: { ...f.definition.practice, version: 2 },
        _assessment: "legacy-private-secret",
      };
      await db.query(
        `INSERT INTO public.generated_cases
      (id,user_id,format,title,definition,engine,presentation,diagnosis_family,setting,patient_profile)
      VALUES ($1,$2,'long','Legacy case',$3,'legacy engine','legacy presentation','hidden legacy diagnosis','Legevakt','79 år')`,
        [id, owner, JSON.stringify(legacy)],
      );
      await db.exec(
        await readFile(
          new URL("20261028010000_private_case_assessments.sql", migrationRoot),
          "utf8",
        ),
      );
      const migrated = (await db.query("SELECT * FROM public.generated_cases WHERE id=$1", [id]))
        .rows[0];
      assert.equal(migrated.diagnosis_family, null);
      assert.equal(migrated.patient_profile, "");
      assert.equal(migrated.definition._assessment, undefined);
      assert.equal(migrated.definition.id, f.definition.id);
      assert.equal(
        migrated.definition.parts[0].questions[0].id,
        f.definition.parts[0].questions[0].id,
      );
      const archived = (
        await db.query("SELECT legacy_payload FROM public.case_assessments WHERE case_id=$1", [id])
      ).rows[0];
      assert.equal(archived.legacy_payload.assessment, "legacy-private-secret");

      await db.exec("SET ROLE authenticated");
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [owner]);
      assert.equal((await db.query("SELECT id FROM public.generated_cases")).rows.length, 1);
      await assert.rejects(db.query("SELECT * FROM public.case_assessments"), /permission denied/i);
      await assert.rejects(
        db.query("UPDATE public.generated_cases SET diagnosis_family='tampered' WHERE id=$1", [id]),
        /permission denied/i,
      );
      const newId = "00000000-0000-4000-8000-000000000004";
      const newDefinition = { ...f.definition, id: `gen-${newId}` };
      const rpc = "SELECT public.create_case_with_assessment($1,$2,$3,$4,$5,$6)";
      const params = [
        newId,
        owner,
        "long",
        JSON.stringify(newDefinition),
        JSON.stringify(f.assessment),
        JSON.stringify(f.semantic),
      ];
      await assert.rejects(db.query(rpc, params), /permission denied/i);
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [stranger]);
      assert.equal((await db.query("SELECT id FROM public.generated_cases")).rows.length, 0);
      await db.exec("RESET ROLE; SET ROLE service_role");
      await db.query(rpc, params);
      assert.equal(
        (await db.query("SELECT case_id FROM public.case_assessments WHERE case_id=$1", [newId]))
          .rows.length,
        1,
      );
      const publicRow = (
        await db.query("SELECT * FROM public.generated_cases WHERE id=$1", [newId])
      ).rows[0];
      assert.ok(!JSON.stringify(publicRow).includes("privat-diagnose"));
      assert.ok(!JSON.stringify(publicRow).includes("rubric"));

      // Force the SECOND insert to fail: the first public insert must roll back.
      await db.exec(`RESET ROLE;
      CREATE FUNCTION public.reject_test_assessment() RETURNS trigger LANGUAGE plpgsql AS
        $$ BEGIN RAISE EXCEPTION 'test private insert failure'; END; $$;
      CREATE TRIGGER reject_test_assessment BEFORE INSERT ON public.case_assessments
        FOR EACH ROW EXECUTE FUNCTION public.reject_test_assessment();
      SET ROLE service_role;`);
      const rejectedId = "00000000-0000-4000-8000-000000000005";
      await assert.rejects(
        db.query(rpc, [
          rejectedId,
          owner,
          "long",
          JSON.stringify({ ...f.definition, id: `gen-${rejectedId}` }),
          JSON.stringify(f.assessment),
          JSON.stringify(f.semantic),
        ]),
        /test private insert failure/,
      );
      assert.equal(
        (await db.query("SELECT id FROM public.generated_cases WHERE id=$1", [rejectedId])).rows
          .length,
        0,
      );

      await db.exec("RESET ROLE; SET ROLE authenticated");
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [owner]);
      await db.query("DELETE FROM public.generated_cases WHERE id=$1", [newId]);
      await db.exec("RESET ROLE");
      assert.equal(
        (await db.query("SELECT case_id FROM public.case_assessments WHERE case_id=$1", [newId]))
          .rows.length,
        0,
      );
    } finally {
      await db.close();
    }
  },
);
