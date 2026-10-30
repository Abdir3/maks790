# MAKS790 case practice

The site is published through Lovable. Supabase provides authentication, data
storage and the application backend. AI requests go directly from Supabase to
OpenAI.

## Publishing

Push changes to GitHub `main`, let Lovable sync the repository, then publish the
site there. Publishing the frontend does not deploy the Supabase function.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## AI connection

The browser calls the `case-api` Supabase Edge Function with the signed-in user's
JWT. That function validates the session and ownership before reading private
assessments or making paid calls. Generation, feedback and model answers use
`gpt-6.1-terra`; dictation uses `gpt-transcribe`. Usage is billed to the OpenAI
project that issued `OPENAI_API_KEY`.

`OPENAI_API_KEY` belongs in **Supabase project secrets**. No AI key or privileged
database key is required in Lovable. Keep credentials out of Git, browser
variables (`VITE_*`) and logs. The committed `.env` contains public Supabase
connection settings used by the published frontend.

Long model calls use OpenAI background responses with `store: false`. Supabase
stores private checkpoints and leases each job to one worker at a time. A database
trigger starts work immediately; a five-second server schedule resumes it even
when every browser is closed. Browser status requests only observe generation;
private drafts and rubrics
remain on the backend. OpenAI temporarily retains background responses for
polling, as described in its [background-mode documentation](https://developers.openai.com/api/docs/guides/background).

Interactive case generation uses one Terra draft at medium reasoning effort.
All text AI requests explicitly use standard (`default`) processing. There is no
Astra fallback or premium-tier environment override. Model and price policy are
centralised in `src/lib/ai-policy.server.ts`.
The original clinical prompt, curriculum coverage and private assessment are
preserved. Fast local checks validate structure, clinical data, calculated blood
gases, timelines, sources and similarity; a concrete failure allows one repair.
The independent solution and AI review run only in the offline calibration tool.
Feedback and model answers retain their separate review when requested.

Before each new provider purchase, a private atomic reservation must fit within
**$0.50 per job, $1 per account per rolling 24 hours and $2 across the application
per rolling 24 hours**. Reservations conservatively cover bounded input, schema,
cache-write pricing and the full output/reasoning token allowance. They remain
counted even after failures or deletion, and are not an invoice of actual usage.
Concurrent requests cannot race past these limits. Generation allows at most two
paid calls (draft plus one repair), with 18,000 output tokens for short cases and
22,000 for long cases. Feedback/model answers allow at most four calls within the
same dollar caps. Unknown submission outcomes never buy an automatic replacement.
These limits cover case generation/feedback/model answers, not dictation or API
requests made outside this application. Prices require review if OpenAI changes
them: [Terra pricing](https://developers.openai.com/api/docs/models/gpt-6.1-terra).

Offline calibration now requires explicit `--budget-usd` of at most `0.50` per
run. It uses Terra with the same input/output limits; no paid benchmark batch is
started by default. Routine verification uses mocked providers and local SQL.

The generation screen shows provider-backed milestones, an animated case preview
and elapsed time. It does not invent a completion percentage. Only a public phase
is sent with progress updates; drafts and answers stay private. Animation respects
the reduced-motion preference.
Users can close the dialog, tab or browser and return on another device signed in
to the same account. The library recovers the job and its finished case from
Supabase. Timing targets are 150 seconds for short cases and 180 for long cases;
provider delays can exceed these targets. Late work continues with honest delay
messaging instead of publishing an invalid case or starting a duplicate request.
When a new attempt fails, the interface offers the last saved case belonging to
the current account without making another model call.

To update the backend, apply the tracked Supabase migrations, then run:

```sh
bun run build:edge
npx supabase@2.122.0 functions deploy case-api --project-ref seqtqwpsellspkxhbeky --use-api
npx supabase@2.122.0 functions deploy case-worker --project-ref seqtqwpsellspkxhbeky --use-api
```

The worker requires a random `CASE_WORKER_SECRET` in Supabase Edge secrets and the
same value in Supabase Vault under `case_worker_secret`. Vault `case_worker_url`
must contain the deployed `case-worker` URL. Set secrets from a private temporary
file or an authenticated dashboard, never in committed SQL. The schedule
`case-ai-worker` calls `dispatch_case_worker()` every five seconds and does no HTTP
work when there are no eligible jobs. Both functions disable gateway JWT checks;
`case-api` verifies the user session itself and `case-worker` validates its private
worker secret. The worker accepts no user-supplied job or prompt.

The generated `supabase/functions/_shared/case-api.js` bundles the same source
modules tested locally. Rebuild it whenever those modules change. Environment
injection is disabled during bundling. The function reads its key at runtime.

For local PostgreSQL permission tests, set `PGLITE_TEST_MODULE` to an installed
`@electric-sql/pglite` package directory before running `bun test tests/`.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
