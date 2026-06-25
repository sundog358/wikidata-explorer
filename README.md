# 🌐 Wikidata Explorer

A portfolio-ready **Next.js 16** application for searching Wikidata, inspecting entity evidence, visualizing relationships, and optionally running **AG2-backed** linked-data research agents.

Live demo: [www.wikidataexplorer.com](https://www.wikidataexplorer.com)

[![Live demo](https://img.shields.io/badge/live-www.wikidataexplorer.com-0ea5e9)](https://www.wikidataexplorer.com)
[![CI](https://github.com/sundog358/wikidata-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/sundog358/wikidata-explorer/actions/workflows/ci.yml)
[![Visual QA](https://img.shields.io/badge/visual%20QA-CI%20artifact-16a34a)](https://github.com/sundog358/wikidata-explorer/actions/workflows/ci.yml)

Wikidata Explorer is the public product and domain. History Puzzle remains a narrative frame inside the demo: the app helps users assemble a trail of entities, statements, labels, references, and linked records into a trustworthy research picture.

The public demo ships safely on Vercel with AI disabled by default, while the AG2 agent runtime can be enabled locally or hosted as a separate container service.

## ✨ Highlights

- 🔎 Search Wikidata by keyword or direct entity/property ID such as `Q42` or `P31`
- 🧾 Inspect normalized labels, descriptions, aliases, statements, sitelinks, languages, and Commons media
- 🕸️ Explore a clickable relationship graph with URL-backed filters, hover previews, selected-edge qualifier/reference summaries, and selected-path Markdown/JSON exports
- ⚖️ Compare two entities without AI by shared properties, unique statements, overlapping linked entities, and Markdown research notes
- 🧭 Follow related items and properties without restarting the search flow
- 🔗 Launch directly into a query with `/search?q=Douglas%20Adams` or a seeded Q42 proof path with graph focus, review, exports, and AI-boundary context
- 🧠 Keep AI behind explicit feature flags for a reliable public Vercel demo
- 🤖 Enable AG2 specialist agents for research, graph analysis, next-entity suggestions, citation verification, comparison, and Markdown reports
- 🐳 Run agents through local conda or a token-protected containerized FastAPI AG2 service
- 🧾 Inspect statement ranks, qualifiers, and references in expandable evidence rows
- 🗃️ Revisit saved AG2 agent runs per entity when AI mode is enabled
- 🧑‍⚖️ Review entity data-quality findings with persisted browser-local task status and source-link hints
- 📤 Export evidence-grounded graph paths, review findings, task status, source hints, and safe QuickStatements draft comments
- 🛡️ Classify specialist workflows through a tested autonomy safety layer before future bot/draft actions
- ✅ Verify changes with lint, unit tests, production build, trace checks, route smoke tests, API contracts, e2e interaction tests, visual QA, and GitHub Actions

## 🧭 Portfolio Case Study

Wikidata Explorer is built to answer a focused research question: how quickly can someone start from one Wikidata entity and understand the trustworthy graph around it?

- **Product decision:** lead with a fast public Next.js explorer, then route reviewers into a seeded Q42 proof path that shows graph context, evidence depth, safe exports, and the AI boundary in one short review.
- **Data depth:** normalize Wikidata labels, statements, qualifiers, references, ranks, media, and language coverage into inspectable UI instead of flattening everything into generic search results.
- **AI boundary:** keep AG2 agents feature-flagged and server-side so the public demo remains reliable while the Python/container runtime can be enabled for richer research workflows.
- **Trust story:** pair graph and curation exports with autonomy-safety gates, route/API contracts, a mocked remote AG2 service contract, browser e2e checks, visual QA screenshots, and deployment trace checks.

## 🧰 Tech Stack

- **Next.js 16 App Router**
- **React 19 stable**
- **TypeScript**
- **Tailwind CSS**
- **Radix UI primitives** for tabs and slots
- **Wikidata Action API**, **Wikibase REST API**, and **Wikimedia Commons API**
- **AG2 / AutoGen** through either the local `wikidata` conda env or `AG2_SERVICE_URL`
- **FastAPI + Docker** for the optional AG2 container runtime
- **Playwright Core** with installed Chrome for local e2e and visual QA
- **GitHub Actions** for CI verification

## 🚀 Local Development

Prerequisites:

- Node.js 20 or newer
- npm

Install and launch:

```powershell
npm install
npm run dev -- --port 3000
```

Open [http://localhost:3000](http://localhost:3000).

## 🔐 Environment

Create `.env` from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Public/demo mode keeps AI disabled:

```powershell
NEXT_PUBLIC_ENABLE_AI_AGENTS=false
ENABLE_AI_AGENTS=false
```

Local conda-backed AI mode:

```powershell
NEXT_PUBLIC_ENABLE_AI_AGENTS=true
ENABLE_AI_AGENTS=true
OPENAI_API_KEY=sk-proj-...
AG2_CONDA_ENV=wikidata
```

Container-backed AI mode:

```powershell
NEXT_PUBLIC_ENABLE_AI_AGENTS=true
ENABLE_AI_AGENTS=true
AG2_SERVICE_URL=http://localhost:8000
AG2_SERVICE_TOKEN=generate-a-random-32-plus-character-secret
```

`OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`. If `AG2_SERVICE_URL` is unset, the Next.js API routes run the Python bridge through `AG2_CONDA_ENV=wikidata` or `AG2_PYTHON`. If `AG2_SERVICE_URL` is set, the container service owns the provider credentials and Next.js calls `/run` on that service with `Authorization: Bearer $AG2_SERVICE_TOKEN`. The token must be present on both Vercel and the AG2 service host and must be at least 32 characters.

Local environment files, provider keys, Pywikibot credentials, runtime files, caches, and research artifacts are ignored by default.

## 🐳 AG2 Container

Build and run the optional agent service from the repo root:

```powershell
docker build -f agents/Dockerfile -t wikidata-explorer-ag2 .
docker run --rm -p 8000:8000 --env-file .env wikidata-explorer-ag2
```

Health check:

```powershell
curl http://localhost:8000/health
```

The Vercel app can stay public and static-friendly while the AG2 service runs on a Docker host such as Render, Railway, Fly, or a private VM. The container runs as a non-root user, disables FastAPI docs by default, and rejects `/run` requests unless the bearer token matches `AG2_SERVICE_TOKEN`.

## 🧪 Useful Commands

```powershell
npm run lint
npm run test
npm run build
npm run verify
npm run smoke
npm run metadata:check
npm run deploy:check
npm run api:contracts
npm run e2e
npm run visual:qa
npm run screenshots:update
npm run trace:check
```

`npm run deploy:check` validates the default public Vercel AI-off environment and warns when `NEXT_PUBLIC_SITE_URL` is missing for production metadata. Use `npm run deploy:check -- --mode=ai-container` before an AI-enabled container deployment. `npm run smoke`, `npm run api:contracts`, `npm run e2e`, and `npm run visual:qa` expect the app to be running locally. In public AI-off mode, API contracts assert fail-closed disabled responses and visual QA captures the disabled chat/agents states. In AI-enabled mode, the same scripts check the AG2 route validation and visible agent workbench.

Override local targets when needed:

```powershell
$env:SMOKE_BASE_URL = "http://localhost:3000"
$env:API_CONTRACT_BASE_URL = "http://localhost:3000"
$env:E2E_BASE_URL = "http://localhost:3000"
$env:VISUAL_QA_BASE_URL = "http://localhost:3000"
$env:METADATA_BASE_URL = "http://localhost:3000"
npm run smoke
npm run e2e
npm run visual:qa
```

## 🖼️ Portfolio Screenshots

These tracked screenshots are refreshed from the visual QA flow. Run `npm run visual:qa`, then `npm run screenshots:update` to copy the canonical portfolio views from `.tmp/visual-qa` into `docs/screenshots`. Visual QA fails on horizontal overflow or browser console/page errors.

| View | Screenshot | What it proves |
| --- | --- | --- |
| 🏠 Home | ![Home desktop](docs/screenshots/home-desktop.png) | The first screen explains the product quickly and routes users into search, graph context, and evidence review. |
| 🕸️ Q42 graph | ![Q42 relationship graph desktop](docs/screenshots/search-q42-graph-desktop.png) | The seeded proof path loads Douglas Adams, focuses the Q42 -> human graph edge, and renders evidence-grounded selected-edge exports. |
| 🤖 Research assistant | ![Research assistant desktop](docs/screenshots/research-assistant-desktop.png) | The AG2 chat surface is available in AI-enabled mode and disabled intentionally in public mode. |
| 📱 Mobile search | ![Q42 search mobile](docs/screenshots/search-q42-mobile.png) | The core explorer remains usable on a narrow viewport without horizontal overflow. |

## 🚢 Production Deployment

Current public mode is live at [www.wikidataexplorer.com](https://www.wikidataexplorer.com):

1. Vercel runs the Next.js app with `NEXT_PUBLIC_ENABLE_AI_AGENTS=false`, `ENABLE_AI_AGENTS=false`, and `NEXT_PUBLIC_SITE_URL=https://www.wikidataexplorer.com`.
2. Public AI routes fail closed with the tested disabled response.
3. `npm run metadata:check` verifies canonical metadata, robots, sitemap, the Millet social preview image, `8sprocket.jpg` site icon, and generated favicon.
4. `npm run trace:check` keeps required Next runtime helpers in API route traces while excluding local repo clutter.

Optional AI-enabled mode remains a separate deployment step:

1. Deploy `agents/Dockerfile` to a container host when ready to demo live AG2 agents.
2. Set the same 32+ character `AG2_SERVICE_TOKEN` in Vercel and the container host.
3. Keep `node scripts/test-ag2-remote-service.mjs` green, then run `npm run deploy:check -- --mode=ai-container` before enabling the AI container path.
4. Enable AI by setting `NEXT_PUBLIC_ENABLE_AI_AGENTS=true`, `ENABLE_AI_AGENTS=true`, `AG2_SERVICE_URL=https://...`, and rate limits such as `AI_AGENT_RATE_LIMIT_MAX=20`, then redeploy the Next.js app.

## 🗂️ Project Structure

- `app/page.tsx`: first-screen search entry point
- `app/opengraph-image/route.ts`: serves the shared JPEG social preview image for Open Graph, Facebook, and Twitter cards
- `app/robots.ts` and `app/sitemap.ts`: public crawl metadata derived from the configured site URL
- `app/search/page.tsx`: main Wikidata explorer workflow, selected graph path exports, graph focus, data-quality summary, and evidence review queue
- `app/chat/page.tsx`: feature-flagged AG2 research assistant
- `app/agents/page.tsx`: feature-flagged AG2 specialist agent workbench overview
- `app/api/chat/route.ts`: feature-flagged AG2-backed chat endpoint
- `app/api/entity-summary/route.ts`: feature-flagged grounded entity summary endpoint
- `app/api/ag2-workflow/route.ts`: feature-flagged specialist workflow endpoint with autonomy safety gating
- `components/relationship-graph.tsx`: clickable, filterable entity relationship visualization with controlled filter state and selected-edge evidence summaries
- `components/nav/main-nav.tsx`: primary nav with AI links hidden unless the AI feature flag is enabled
- `lib/wikidata.ts`: Wikidata API client and normalization helpers
- `lib/site-config.mjs`: shared portfolio metadata, public URL, social-preview, favicon, and site-icon configuration
- `public/favicon.ico`: generated site favicon based on the sprocket image
- `public/images/8sprocket.jpg`: source JPEG used by site icon and Apple icon metadata
- `public/images/jean-francois-millet-gleaners-google-art-project-2.jpg`: source JPEG used by the social preview image route
- `lib/ai-feature-flags.mjs`: shared public/server AI feature flag helper
- `lib/autonomy-safety.mjs`: tested autonomy policy for read-only, draft, and bot-risk actions
- `lib/curation-export.mjs`: safe QuickStatements draft and Markdown review export helpers
- `lib/graph-path-export.mjs`: tested selected graph path Markdown/JSON export helpers with qualifier/reference evidence summaries
- `lib/review-source-hints.mjs`: tested source-hint extraction for reference URLs, stated-in records, retrieved dates, and formatter-aware external IDs
- `lib/search-url-state.mjs`: tested shareable tab, graph-filter, and graph-focus URL state helpers
- `lib/data-quality.mjs`: tested entity evidence scoring, source-link coverage, and trust-signal summary helper
- `lib/entity-comparison.mjs`: tested two-entity comparison helper for shared properties, unique properties, overlapping linked entities, and Markdown exports
- `lib/ag2.ts`: Next.js-to-AG2 bridge with local Python fallback, token-authenticated remote `AG2_SERVICE_URL` support, missing-key guard, and retry/backoff
- `lib/ag2-remote-service.mjs`: tested remote AG2 service client for `/run` payloads, bearer auth, success responses, and service error mapping
- `lib/ag2-errors.mjs`: shared AG2 bridge error type for local and remote runtime failures
- `lib/ag2-service-auth.mjs`: shared AG2 service bearer-token validation helper
- `lib/ai-rate-limit.mjs`: in-memory public AI route throttling helper
- `agents/wikidata_ag2_agent.py`: bounded AG2 agent bridge for chat, research, graph analysis, suggestions, verification, comparison, and reports
- `agents/ag2_service.py`: token-protected FastAPI wrapper for the containerized AG2 runtime
- `agents/Dockerfile`: Docker image for hosting the AG2 service outside Vercel
- `scripts/check-deploy-env.mjs`: pre-deploy environment guard for public AI-off and AI container modes
- `scripts/test-ai-feature-flags.mjs`: feature-flag mode tests
- `scripts/test-ag2-service-security.mjs`: service-token, bridge-auth, FastAPI, and Docker hardening checks
- `scripts/test-ag2-remote-service.mjs`: mocked AG2 container contract test for remote `/run` success, auth, and sanitized service failures
- `scripts/test-entity-comparison.mjs`: deterministic entity comparison and Markdown export tests
- `scripts/test-ai-rate-limit.mjs`: AI route throttling helper tests
- `scripts/smoke-routes.mjs`: local route and API smoke checks
- `scripts/test-public-metadata.mjs`: live metadata, robots, sitemap, and Open Graph image checks
- `scripts/test-api-contracts.mjs`: live API validation, safety, disabled-mode, and precondition contract checks
- `scripts/test-search-interaction.mjs`: browser interaction test for data-quality summary, AI-off comparison, graph filtering, hidden/visible AI graph focus, selected-path export, traversal, and direct PID lookup
- `scripts/visual-qa.mjs`: portfolio screenshot, route-surface, layout overflow, and browser console/page-error checks
- `scripts/refresh-portfolio-screenshots.mjs`: copies verified visual QA captures into tracked README screenshot assets
- `.github/workflows/ci.yml`: GitHub Actions verification, smoke, e2e, and visual QA
- `ROADMAP.md`: forward-looking product and engineering plan

## 🛡️ Verification Status

Run `npm run verify` before shipping code changes. Run `npm run metadata:check` with the app running to validate title, description, canonical, Open Graph/Twitter tags, robots, sitemap, social preview image, favicon, and site icon. `npm run test` includes a mocked remote AG2 service contract so the container bridge is checked without provider credentials. Run `npm run smoke`, `npm run api:contracts`, `npm run e2e`, and `npm run visual:qa` with the local dev server running to catch route, interaction, console, hydration, and layout regressions. After intentional visual changes, run `npm run screenshots:update` so tracked portfolio screenshots match the verified UI.

CI also runs install, verify, production trace checks, smoke, public metadata checks, API contracts, e2e, visual QA, and screenshot artifact upload on GitHub Actions.

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for the recommended development path toward a stronger research tool, richer graph exploration, stronger AI context, containerized agent deployment, and public portfolio readiness.
