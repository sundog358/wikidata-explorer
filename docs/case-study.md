# Wikidata Explorer Case Study

Last reviewed: June 29, 2026

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
- `npm run ag2:demo:check -- --health` verifies intentional AI demo flags, AG2 service health, docs-off posture, rate limits, grounding-contract evidence, and hosted/durable monitoring before demo traffic.
- `npm run ag2:hosted:proof` verifies an intentionally AI-enabled hosted app can reach the AG2 service, records the app/service target pair, returns a grounded live route response, and delivers an induced API failure into the hosted observability receiver.
- `npm run portfolio:evidence` validates proof logs, rejects secret-shaped text, and writes Markdown/JSON summaries with release-readiness classification, GitHub Actions provenance, and SHA-256 artifact digests for release artifacts.
- `npm run portfolio:hosted:preflight` checks local hosted-proof variables or GitHub Actions secret metadata before the final hosted proof run.
- `npm run portfolio:10:check` is the final release gate; it requires public production proof, hosted ops proof, and hosted AG2 proof logs to all pass before the portfolio is treated as 10/10.
- `npm run production:proof` runs the live metadata, route smoke, homepage proof-path, and search/graph/comparison interaction checks against the public portfolio URL after deployment.
- The manual GitHub Actions `Production Proof` workflow wraps the live proof command and can optionally run hosted ops proof plus hosted AG2 proof with repository secrets, then uploads public, workspace/observability, AI, and `portfolio-evidence-summary` logs as one self-validating release artifact.
- The manual GitHub Actions `AG2 Demo Proof` workflow wraps the hosted AG2 proof independently and uploads `ag2-hosted-proof-log` when only an AI-enabled demo target needs verification.
- `npm run ops:proof` verifies token-protected hosted workspace persistence, account/project namespace isolation, curation-task and agent-run summaries, durable observability receiver behavior, and the hosted app target URL when private hosted credentials are configured.
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
- The AG2 Docker image declares a `/health` container healthcheck and uses a tight `.dockerignore` allowlist so hosted builds do not upload local env files, screenshots, docs, or app dependencies.

This split keeps the public demo dependable while preserving a credible path to richer grounded AI workflows.

Monitoring follows the same safety boundary: API failures are classified into sanitized categories, optional webhook payloads include alert-rule metadata, and the built-in receiver can retain a bounded event window either in memory or in a durable filesystem-backed store for hosted monitoring demos.

## Current State

The project is portfolio-ready now. The remaining roadmap work is about making the workspace deeper:

- a captured green `AG2 Demo Proof` artifact from an optional hosted AG2 demo with live citation validation;
- configured GitHub Actions secrets and a real hosted `AG2_SERVICE_URL` that pass `portfolio:hosted:preflight`;
- a final `portfolio-evidence-summary` artifact that says `Portfolio 10/10 ready` and links back to the GitHub Actions run URL, commit SHA, and SHA-256 proof-log digests;
- broader non-biographical fixture coverage;
- identity-backed curation tasks and persisted agent history beyond the optional account-scoped project workspace store;
- more accessibility and dark-mode visual QA coverage.

The central product bet remains the same: evidence-first linked-data exploration should feel faster and safer than reading raw Wikidata pages or asking an ungrounded chatbot.
