import { it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

it(
  "keeps job checkpoints private and atomically leases only the owner's pending job",
  {
    skip: !process.env["PGLITE_TEST_MODULE"],
  },
  async () => {
    const require = createRequire(import.meta.url);
    const { PGlite } = require(process.env["PGLITE_TEST_MODULE"]!);
    const db = new PGlite();
    try {
      await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000001'), ('00000000-0000-4000-8000-000000000002');`);
      await db.exec(await readFile("supabase/migrations/20261030150000_case_ai_jobs.sql", "utf8"));
      await db.exec(`INSERT INTO public.case_ai_jobs(id,user_id,case_id,kind,request_hash,context)
      VALUES('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000010','generate','test','{}');`);
      await db.exec("SET ROLE authenticated");
      await assert.rejects(db.query("SELECT * FROM public.case_ai_jobs"));
      await assert.rejects(
        db.query(`SELECT * FROM public.claim_case_ai_job(
      '00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000020')`),
      );
      await db.exec("RESET ROLE; SET ROLE service_role");
      const claim = (owner: string, lease: string) =>
        db.query("SELECT * FROM public.claim_case_ai_job($1,$2,$3)", [
          "00000000-0000-4000-8000-000000000010",
          owner,
          lease,
        ]);
      const owner = "00000000-0000-4000-8000-000000000001";
      assert.equal(
        (
          await claim(
            "00000000-0000-4000-8000-000000000002",
            "00000000-0000-4000-8000-000000000020",
          )
        ).rows.length,
        0,
      );
      assert.equal((await claim(owner, "00000000-0000-4000-8000-000000000020")).rows.length, 1);
      assert.equal((await claim(owner, "00000000-0000-4000-8000-000000000021")).rows.length, 0);
      await assert.rejects(
        db.exec(`INSERT INTO public.case_ai_jobs(id,user_id,case_id,kind,request_hash,context)
      VALUES('00000000-0000-4000-8000-000000000011','${owner}',
      '00000000-0000-4000-8000-000000000011','generate','second','{}')`),
      );
      await db.exec("UPDATE public.case_ai_jobs SET lease_until = now() - interval '1 second'");
      assert.equal((await claim(owner, "00000000-0000-4000-8000-000000000021")).rows.length, 1);
      await db.exec("UPDATE public.case_ai_jobs SET status = 'completed', lease_until = NULL");
      assert.equal((await claim(owner, "00000000-0000-4000-8000-000000000022")).rows.length, 0);
    } finally {
      await db.close();
    }
  },
);
