# Wikidata Explorer Case Study

Last reviewed: June 25, 2026

Wikidata Explorer is a public linked-data research workbench. The product goal is narrow on purpose: start with one Wikidata entity, then make the trustworthy graph around it clear enough to inspect, compare, export, and hand off.

## Product Problem

Wikidata is rich, but raw entity pages and API responses make it hard to answer practical research questions quickly:

- Which relationships are backed by references?
- Which linked entities are worth opening next?
- What changed when comparing two or three entities?
- Can AI help without hiding source evidence or making the public demo fragile?

The app treats Wikidata as a research trail rather than a search box. It keeps entity labels, statement ranks, qualifiers, references, source hints, graph paths, comparison exports, and AI boundaries visible in the workflow.

## Architecture

The public app is a Next.js 16 / React 19 App Router application deployed on Vercel at `www.wikidataexplorer.com`.

- `app/search/page.tsx` owns the main workbench: search, entity selection, graph filters, comparison, statements, media, languages, review queue, and AI-enabled handoffs.
- `lib/wikidata.ts` normalizes Wikidata Action API, Wikibase REST, and Commons metadata into a consistent client-side model.
- `components/relationship-graph.tsx` renders the graph with depth, layout, evidence, rank, relationship, focus, preview, and pin controls.
- `lib/entity-comparison.mjs`, `lib/graph-path-export.mjs`, and `lib/curation-export.mjs` produce shareable Markdown/JSON research artifacts.
- `app/api/*` routes stay server-side for AG2 workflows, feature flags, rate limits, and key isolation.
- `agents/` contains the optional AG2/FastAPI runtime that can run locally or behind `AG2_SERVICE_URL`.

The public deployment keeps AI disabled by default. That lets the core explorer remain fast and reliable while the AI runtime can be enabled intentionally for local or private demos.

## AI Safety Boundary

AI is an optional layer, not the foundation of the public product.

- Public mode sets `NEXT_PUBLIC_ENABLE_AI_AGENTS=false` and `ENABLE_AI_AGENTS=false`.
- AI API routes fail closed with tested disabled responses.
- Provider keys never ship to the browser.
- The optional AG2 service requires a 32+ character bearer token and runs as a separate container service.
- Specialist workflows pass through `lib/autonomy-safety.mjs`, which classifies read-only, draft, supervised bot, sandbox bot, and critical write-risk actions.
- AG2 prompts require citation-style `Grounding references` sections with Wikidata Q/P IDs, statement IDs, and source URLs when supplied.
- Draft curation exports keep QuickStatements rows commented until a human adds sources and approves edits.

The safety decision is product-level as much as technical: the public portfolio demo should prove judgment, not just model access.

## Research Workflow

The seeded proof path starts with Douglas Adams (`Q42`) and focuses the `instance of (P31) -> human (Q5)` graph edge. From there a reviewer can:

- inspect statement ranks, qualifiers, references, and source hints;
- change graph depth and layout modes;
- pin relationships and compare evidence strength;
- export selected graph paths as Markdown or JSON;
- compare `Q42` against `Q80`, `Q46248`, or a third entity such as `Q25169`;
- open an AI-enabled chat handoff with selected entity, statement, graph-focus, and path-export context.

The app also supports direct property lookup such as `P31`, related-work traversal such as `Q25169`, route-restored comparison exports, and deterministic fixture-backed outage states.

## Testing Strategy

The verification loop is intentionally broader than a typical portfolio app because the user-facing value depends on external APIs and graph-heavy UI.

- `npm run verify` runs lint, deterministic tests, and production build.
- `npm run api:contracts` checks public AI-off failures and AI-enabled route validation.
- `npm run e2e` covers proof paths, graph interactions, statements, comparison, exports, URL restore, and route-mocked fixture flows.
- `npm run perf:check` budgets Q42 route readiness, graph readiness, graph node count, and DOM size.
- `npm run visual:qa` captures portfolio surfaces and fails on console errors, hydration errors, and horizontal overflow.
- `npm run trace:check` verifies deployed API route traces include required Next runtime helpers without bundling local clutter.
- Deterministic fixtures cover `Q42`, `Q80`, `Q25169`, `Q46248`, and `P31`, including live-workbench route mocks and outage states.

The fixture strategy keeps CI useful even when Wikidata, Commons, or language metadata endpoints are slow or unavailable.

## Deployment Tradeoffs

Vercel is the right public host for the AI-off product because it keeps the search, graph, comparison, and export workflows easy to deploy and inspect.

The AG2 runtime is deliberately separate:

- Vercel should not hold long-running Python/AG2 execution as the default path.
- The container can be hosted on Render, Railway, Fly, or a private VM when an AI-enabled demo is intentional.
- The AG2 service owns provider credentials and exposes only a token-protected `/run` endpoint to Next.js.
- FastAPI docs are disabled in production unless explicitly enabled.

This split keeps the public demo dependable while preserving a credible path to richer grounded AI workflows.

## Current State

The project is portfolio-ready now. The remaining roadmap work is about making the workspace deeper:

- optional hosted AG2 demo with live citation validation;
- broader non-biographical fixture coverage;
- persisted curation tasks and persisted agent history once storage is introduced;
- more accessibility and dark-mode visual QA coverage.

The central product bet remains the same: evidence-first linked-data exploration should feel faster and safer than reading raw Wikidata pages or asking an ungrounded chatbot.
