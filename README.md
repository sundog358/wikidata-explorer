# Wikidata Explorer

A portfolio-ready Next.js application for searching Wikidata, inspecting entity statements, visualizing relationships, and using an AI research assistant for linked-data workflows.

## Highlights

- Search Wikidata by keyword or direct entity/property ID such as `Q42` or `P31`
- Inspect normalized labels, descriptions, aliases, statements, sitelinks, languages, and Commons media
- Explore a clickable relationship graph built from entity statement values
- Collect related items and properties without restarting the search flow
- Launch directly into a query with `/search?q=Douglas%20Adams`
- Use the AI research assistant when server-side OpenAI credentials are available
- Verify changes with lint, unit tests, production build, and local smoke checks

## Tech Stack

- Next.js 15 App Router
- React 19 release candidate
- Tailwind CSS
- Radix UI primitives for tabs and slots
- Wikidata Action API, Wikibase REST API, and Wikimedia Commons API
- AI SDK 6 with a server-side OpenAI route

## Environment

Create `.env` from `.env.example` for local chat support:

```powershell
Copy-Item .env.example .env
```

Set `OPENAI_API_KEY` to a valid project key. `OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`.

## Local Development

Prerequisites:

- Node.js 20 or newer is recommended
- npm

Install and launch:

```powershell
npm install
npm run dev -- --port 3000
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Commands

```powershell
npm run lint
npm run test
npm run build
npm run verify
npm run smoke
npm run visual:qa
```

`npm run smoke` expects the app to be running locally. `npm run visual:qa` captures portfolio screenshots and checks for horizontal overflow. Override the target for both with local environment variables when needed:

```powershell
$env:SMOKE_BASE_URL = "http://localhost:3000"
$env:VISUAL_QA_BASE_URL = "http://localhost:3000"
npm run smoke
npm run visual:qa
```

## Project Structure

- `app/page.tsx`: first-screen search entry point
- `app/search/page.tsx`: main Wikidata explorer workflow
- `app/chat/page.tsx`: AI research assistant
- `app/api/chat/route.ts`: server-side chat streaming endpoint
- `components/relationship-graph.tsx`: clickable entity relationship visualization
- `lib/wikidata.ts`: Wikidata API client and normalization helpers
- `lib/wikidata-utils.mjs`: unit-tested Wikidata ID and sitelink utilities
- `scripts/smoke-routes.mjs`: local route and API smoke checks

## Data And Secrets

Local research files, Pywikibot runtime files, caches, and environment files are ignored by default. Keep API keys and local Wikidata credentials out of git.

## Verification Status

Run `npm run verify` before shipping code changes. Run `npm run smoke` and `npm run visual:qa` with the local dev server running to catch route and layout regressions such as `/search?q=Q42` failures.