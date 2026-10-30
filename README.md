# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## AI connection

Case generation, feedback and model answers use `gpt-6-astra` directly through
the OpenAI Responses API. Usage is billed to the OpenAI project that issued
`OPENAI_API_KEY`.

Configure `OPENAI_API_KEY` as a secret in the deployed app's server runtime.
Locally, provide it through the shell environment or an ignored `.env.local`.
Keep the value out of the committed `.env`, browser variables (`VITE_*`), logs
and Git. See [Lovable's Secrets documentation](https://docs.lovable.dev/features/secrets)
for project secret configuration. Verify that the secret reaches the TanStack
server functions before publishing.

Preserve the existing `CASE_ASSESSMENT_KEY` and `LOVABLE_API_KEY`: stored case
assessments are encrypted with the former, or with the latter as a legacy
fallback. Changing or deleting the active encryption key makes those assessments
unreadable. The AI client itself uses only `OPENAI_API_KEY` and fails explicitly
if it is unavailable.

After syncing the change, test a generated case, feedback and a model answer in
the preview, then publish and verify the same flow on the published URL.
Git synchronization alone does not update the published app.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
