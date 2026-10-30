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
`gpt-6-astra`; dictation uses `gpt-transcribe`. Usage is billed to the OpenAI
project that issued `OPENAI_API_KEY`.

`OPENAI_API_KEY` belongs in **Supabase project secrets**. No AI key or privileged
database key is required in Lovable. Keep credentials out of Git, browser
variables (`VITE_*`) and logs. The committed `.env` contains public Supabase
connection settings used by the published frontend.

Long Astra calls use OpenAI background responses with `store: false`. Supabase
stores private checkpoints and leases each job to one request at a time. Polls
resume the existing generation; private drafts and rubrics
remain on the backend. OpenAI temporarily retains background responses for
polling, as described in its [background-mode documentation](https://developers.openai.com/api/docs/guides/background).

Interactive case generation uses one Astra draft at medium reasoning effort.
The original clinical prompt, curriculum coverage and private assessment are
preserved. Fast local checks validate structure, clinical data, calculated blood
gases, timelines, sources and similarity; a concrete failure allows one repair.
The independent solution and AI review run only in the offline calibration tool.
Feedback and model answers retain their separate review when requested.

The generation screen shows provider-backed milestones, an animated case preview
and elapsed time. It does not invent a completion percentage. Only a public phase
is sent with progress updates; drafts and answers stay private. Animation respects
the reduced-motion preference.

To update the backend, apply the tracked Supabase migrations, then run:

```sh
bun run build:edge
npx supabase@2.122.0 functions deploy case-api --project-ref seqtqwpsellspkxhbeky --use-api
```

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
