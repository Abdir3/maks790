import { it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

it(
  "atomically caps model spending and keeps failed/deleted reservations private and nonrefundable",
  {
    skip: !process.env["PGLITE_TEST_MODULE"],
  },
  async () => {
    const require = createRequire(import.meta.url);
    const { PGlite } = require(process.env["PGLITE_TEST_MODULE"]!);
    const db = new PGlite();
    const id = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
    const hash = "a".repeat(64);
    try {
      await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);`);
      for (const version of [
        "20261030150000_case_ai_jobs",
        "20261030160000_durable_case_jobs",
        "20261030170000_case_ai_spending_limits",
      ])
        await db.exec(await readFile(`supabase/migrations/${version}.sql`, "utf8"));
      for (const owner of [1, 2, 3, 4])
        await db.query("INSERT INTO auth.users VALUES ($1)", [id(owner)]);
      const seed = async (job: number, owner: number, kind = "generate") => {
        await db.query("UPDATE public.case_ai_jobs SET status='failed' WHERE user_id=$1", [
          id(owner),
        ]);
        await db.query(
          `INSERT INTO public.case_ai_jobs(id,user_id,case_id,kind,request_hash,context,lease_token,lease_until)
        VALUES($1,$2,$1,$3,$4,'{}',$5,now()+interval '120 seconds')`,
          [id(job), id(owner), kind, hash, id(job + 1000)],
        );
      };
      const reserve = async (
        job: number,
        owner: number,
        step: number,
        amount: number | string,
        limits = [0.5, 1, 2],
        requestHash = hash,
        lease = id(job + 1000),
      ) => {
        const result = await db.query(
          "SELECT public.reserve_case_ai_spend($1,$2,$3,$4,$5,$6,$7,$8,$9) AS reservation",
          [id(job), id(owner), lease, step, requestHash, amount, ...limits],
        );
        return result.rows[0].reservation;
      };
      await seed(10, 1);
      await db.exec("SET ROLE authenticated");
      await assert.rejects(db.query("SELECT * FROM public.case_ai_spend_reservations"));
      await assert.rejects(reserve(10, 1, 0, 0.1));
      await db.exec("RESET ROLE; SET ROLE service_role");
      await assert.rejects(db.exec("DELETE FROM public.case_ai_spend_reservations"));
      assert.equal((await reserve(10, 2, 0, 0.1)).reason, "invalid-job");
      assert.equal((await reserve(10, 1, 0, 0.1, undefined, hash, id(9999))).reason, "invalid-job");
      assert.equal((await reserve(10, 1, 0, "NaN")).reason, "invalid-reservation");
      assert.equal(
        (await reserve(10, 1, 0, 0.1, undefined, "malformed")).reason,
        "invalid-reservation",
      );
      assert.equal((await reserve(10, 1, 0, 0.3)).allowed, true);
      assert.equal((await reserve(10, 1, 0, 0.3)).allowed, true);
      assert.equal((await reserve(10, 1, 0, 0.29)).reason, "reservation-mismatch");
      assert.equal(
        (await reserve(10, 1, 0, 0.3, undefined, "b".repeat(64))).reason,
        "reservation-mismatch",
      );
      assert.equal((await reserve(10, 1, 1, 0.3)).reason, "job-limit");
      assert.equal((await reserve(10, 1, 2, 0.01)).reason, "attempt-limit");
      assert.equal(
        (await db.query("SELECT count(*)::int AS count FROM public.case_ai_spend_reservations"))
          .rows[0].count,
        1,
      );
      await db.query("DELETE FROM public.case_ai_jobs WHERE id=$1", [id(10)]);
      assert.equal(
        (
          await db.query(
            "SELECT sum(maximum_cost_usd)::text AS amount FROM public.case_ai_spend_reservations",
          )
        ).rows[0].amount,
        "0.300000",
      );
      await seed(11, 1);
      assert.equal((await reserve(11, 1, 0, 0.5)).allowed, true);
      await seed(12, 1);
      assert.equal((await reserve(12, 1, 0, 0.21)).reason, "owner-limit");
      assert.equal((await reserve(12, 1, 0, 0.2)).allowed, true);
      await seed(20, 2);
      assert.equal((await reserve(20, 2, 0, 0.5)).allowed, true);
      await seed(21, 2);
      assert.equal((await reserve(21, 2, 0, 0.5)).allowed, true);
      await seed(30, 3);
      assert.equal((await reserve(30, 3, 0, 0.01)).reason, "project-limit");
      // The server cannot accidentally increase the hard maximum with settings.
      assert.equal((await reserve(30, 3, 0, 0.01, [100, 100, 100])).reason, "project-limit");
      await db.exec("RESET ROLE");
      await db.query("DELETE FROM auth.users WHERE id IN ($1,$2)", [id(1), id(2)]);
      await db.exec("SET ROLE service_role");
      assert.equal((await reserve(30, 3, 0, 0.01)).reason, "project-limit");
      // Rollover is genuinely rolling 24h, not reset by deleting an account/job.
      await db.exec(
        "RESET ROLE; UPDATE public.case_ai_spend_reservations SET created_at=now()-interval '25 hours'; SET ROLE service_role",
      );
      assert.equal((await reserve(30, 3, 0, 0.01, [0, 1, 2])).reason, "job-limit");
      assert.equal((await reserve(30, 3, 0, 0.01, [0.5, 0, 2])).reason, "owner-limit");
      assert.equal((await reserve(30, 3, 0, 0.01, [0.5, 1, 0])).reason, "project-limit");
      assert.equal((await reserve(30, 3, 0, 0.3, [0.5, 1, 0.5])).allowed, true);
      await seed(40, 4);
      const overlap = await Promise.all([
        reserve(30, 3, 1, 0.15, [0.5, 1, 0.5]),
        reserve(40, 4, 0, 0.15, [0.5, 1, 0.5]),
      ]);
      assert.equal(overlap.filter((result) => result.allowed).length, 1);
      assert.equal(overlap.filter((result) => result.reason === "project-limit").length, 1);
    } finally {
      await db.close();
    }
  },
);
