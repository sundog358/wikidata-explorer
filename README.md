# Wikidata Explorer

A Next.js application for searching Wikidata, inspecting entity statements, and following linked entities through the knowledge graph.

## What Works

- Search Wikidata by keyword or by direct entity/property ID such as `Q42` or `P31`
- Inspect normalized labels, descriptions, aliases, statements, sitelinks, languages, and Commons media
- Follow related items and properties from the selected entity without restarting the search
- Launch directly into a query with `/search?q=Douglas%20Adams`
- Use the AI chat workspace when server-side OpenAI credentials are available

## Tech Stack

- Next.js 15 App Router
- React 19 release candidate
- Tailwind CSS
- Radix UI primitives for app controls
- Wikidata Action API and Wikibase REST API
- Vercel AI SDK for chat streaming


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
npm run dev -- --port 3002
```

Open [http://localhost:3002](http://localhost:3002).

Useful commands:

```powershell
npm run lint
npm run build
npm run verify`r`nnpm run smoke
```

## Project Structure

- `app/page.tsx`: first-screen search entry point
- `app/search/page.tsx`: main Wikidata explorer workflow
- `app/chat/page.tsx`: multi-agent chat workspace
- `app/api/chat/route.ts`: server-side chat streaming endpoint
- `lib/wikidata.ts`: Wikidata API client and normalization helpers
- `components/ui/`: small set of UI primitives used by the app

## Data And Secrets

Local research files, Pywikibot runtime files, caches, and environment files are ignored by default. Keep API keys and local Wikidata credentials out of git.

## Verification Status

The app should pass `npm run lint` and `npm run build` before changes are considered ready. `npm run verify`r`nnpm run smoke` runs both.