# 🌐 Wikidata Explorer

A portfolio-ready **Next.js 16** application for searching Wikidata, inspecting entity evidence, visualizing relationships, and optionally running **AG2-backed** linked-data research agents.

The public demo is designed to ship safely on Vercel with AI disabled by default, while the AG2 agent runtime can be enabled locally or hosted as a separate container service.

## ✨ Highlights

- 🔎 Search Wikidata by keyword or direct entity/property ID such as `Q42` or `P31`
- 🧾 Inspect normalized labels, descriptions, aliases, statements, sitelinks, languages, and Commons media
- 🕸️ Explore a clickable relationship graph with URL-backed filters, hover previews, selected-edge details, and selected-path Markdown/JSON exports
- 🧭 Follow related items and properties without restarting the search flow
- 🔗 Launch directly into a query with `/search?q=Douglas%20Adams`
- 🧠 Keep AI behind explicit feature flags for a reliable public Vercel demo
- 🤖 Enable AG2 specialist agents for research, graph analysis, next-entity suggestions, citation verification, comparison, and Markdown reports
- 🐳 Run agents through local conda or a containerized FastAPI AG2 service
- 🧾 Inspect statement ranks, qualifiers, and references in expandable evidence rows
- 🗃️ Revisit saved AG2 agent runs per entity when AI mode is enabled
- 🧑‍⚖️ Review entity data-quality findings with persisted browser-local task status and source-link hints
- 📤 Export selected graph paths, review findings, task status, source hints, and safe QuickStatements draft comments
- 🛡️ Classify specialist workflows through a tested autonomy safety layer before future bot/draft actions
- ✅ Verify changes with lint, unit tests, production build, trace checks, route smoke tests, API contracts, e2e interaction tests, visual QA, and GitHub Actions

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
```

`OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`. If `AG2_SERVICE_URL` is unset, the Next.js API routes run the Python bridge through `AG2_CONDA_ENV=wikidata` or `AG2_PYTHON`. If `AG2_SERVICE_URL` is set, the container service owns the provider credentials and Next.js calls `/run` on that service.

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

The Vercel app can stay public and static-friendly while the AG2 service runs on a Docker host such as Render, Railway, Fly, or a private VM.

## 🧪 Useful Commands

```powershell
npm run lint
npm run test
npm run build
npm run verify
npm run smoke
npm run api:contracts
npm run e2e
npm run visual:qa
npm run trace:check
```

`npm run smoke`, `npm run api:contracts`, `npm run e2e`, and `npm run visual:qa` expect the app to be running locally. In public AI-off mode, API contracts assert fail-closed disabled responses and visual QA captures the disabled chat/agents states. In AI-enabled mode, the same scripts check the AG2 route validation and visible agent workbench.

Override local targets when needed:

```powershell
$env:SMOKE_BASE_URL = "http://localhost:3000"
$env:API_CONTRACT_BASE_URL = "http://localhost:3000"
$env:E2E_BASE_URL = "http://localhost:3000"
$env:VISUAL_QA_BASE_URL = "http://localhost:3000"
npm run smoke
npm run e2e
npm run visual:qa
```

## 🖼️ Portfolio Screenshots

These tracked screenshots are refreshed from the visual QA flow. `npm run visual:qa` also captures current QA views under `.tmp/visual-qa` and fails on horizontal overflow or browser console/page errors.

| View | Screenshot | What it proves |
| --- | --- | --- |
| 🏠 Home | ![Home desktop](docs/screenshots/home-desktop.png) | The first screen explains the product quickly and routes users into search. |
| 🕸️ Q42 graph | ![Q42 relationship graph desktop](docs/screenshots/search-q42-graph-desktop.png) | The main explorer loads Wikidata data, prefers stable English labels, and renders a clickable relationship graph. |
| 🤖 Research assistant | ![Research assistant desktop](docs/screenshots/research-assistant-desktop.png) | The AG2 chat surface is available in AI-enabled mode and disabled intentionally in public mode. |
| 📱 Mobile search | ![Q42 search mobile](docs/screenshots/search-q42-mobile.png) | The core explorer remains usable on a narrow viewport without horizontal overflow. |

## 🚢 Public Deployment Plan

1. Deploy the Next.js app to Vercel with `NEXT_PUBLIC_ENABLE_AI_AGENTS=false` and `ENABLE_AI_AGENTS=false`.
2. Add the public Vercel URL and badge to this README after the first successful deploy.
3. Deploy `agents/Dockerfile` to a container host when ready to demo live AG2 agents.
4. Enable AI by setting `NEXT_PUBLIC_ENABLE_AI_AGENTS=true`, `ENABLE_AI_AGENTS=true`, and `AG2_SERVICE_URL=https://...`, then redeploy the Next.js app.

## 🗂️ Project Structure

- `app/page.tsx`: first-screen search entry point
- `app/search/page.tsx`: main Wikidata explorer workflow, selected graph path exports, graph focus, data-quality summary, and evidence review queue
- `app/chat/page.tsx`: feature-flagged AG2 research assistant
- `app/agents/page.tsx`: feature-flagged AG2 specialist agent workbench overview
- `app/api/chat/route.ts`: feature-flagged AG2-backed chat endpoint
- `app/api/entity-summary/route.ts`: feature-flagged grounded entity summary endpoint
- `app/api/ag2-workflow/route.ts`: feature-flagged specialist workflow endpoint with autonomy safety gating
- `components/relationship-graph.tsx`: clickable, filterable entity relationship visualization with controlled filter state
- `components/nav/main-nav.tsx`: primary nav with AI links hidden unless the AI feature flag is enabled
- `lib/wikidata.ts`: Wikidata API client and normalization helpers
- `lib/ai-feature-flags.mjs`: shared public/server AI feature flag helper
- `lib/autonomy-safety.mjs`: tested autonomy policy for read-only, draft, and bot-risk actions
- `lib/curation-export.mjs`: safe QuickStatements draft and Markdown review export helpers
- `lib/graph-path-export.mjs`: tested selected graph path Markdown/JSON export helpers
- `lib/review-source-hints.mjs`: tested source-hint extraction for reference URLs, stated-in records, retrieved dates, and formatter-aware external IDs
- `lib/search-url-state.mjs`: tested shareable tab, graph-filter, and graph-focus URL state helpers
- `lib/data-quality.mjs`: tested entity evidence scoring, source-link coverage, and trust-signal summary helper
- `lib/ag2.ts`: Next.js-to-AG2 bridge with local Python fallback, remote `AG2_SERVICE_URL` support, missing-key guard, and retry/backoff
- `agents/wikidata_ag2_agent.py`: bounded AG2 agent bridge for chat, research, graph analysis, suggestions, verification, comparison, and reports
- `agents/ag2_service.py`: FastAPI wrapper for the containerized AG2 runtime
- `agents/Dockerfile`: Docker image for hosting the AG2 service outside Vercel
- `scripts/test-ai-feature-flags.mjs`: feature-flag mode tests
- `scripts/smoke-routes.mjs`: local route and API smoke checks
- `scripts/test-api-contracts.mjs`: live API validation, safety, disabled-mode, and precondition contract checks
- `scripts/test-search-interaction.mjs`: browser interaction test for data-quality summary, graph filtering, hidden/visible AI graph focus, selected-path export, traversal, and direct PID lookup
- `scripts/visual-qa.mjs`: portfolio screenshot, route-surface, layout overflow, and browser console/page-error checks
- `.github/workflows/ci.yml`: GitHub Actions verification, smoke, e2e, and visual QA
- `ROADMAP.md`: forward-looking product and engineering plan

## 🛡️ Verification Status

Run `npm run verify` before shipping code changes. Run `npm run smoke`, `npm run api:contracts`, `npm run e2e`, and `npm run visual:qa` with the local dev server running to catch route, interaction, console, hydration, and layout regressions.

CI also runs install, verify, production trace checks, smoke, API contracts, e2e, visual QA, and screenshot artifact upload on GitHub Actions.

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for the recommended development path toward a stronger research tool, richer graph exploration, stronger AI context, containerized agent deployment, and public portfolio readiness.
