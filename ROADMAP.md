# Wikidata Explorer Roadmap

Last reviewed: June 25, 2026

This roadmap tracks the path from a strong public portfolio app to a credible linked-data research workspace. The public Next.js app is live at `https://www.wikidataexplorer.com` with AI disabled by default; the AG2 runtime remains available locally or through the token-protected container service path.

`Wikidata Explorer` is the public product name and domain. Users assemble a research picture from linked records, statement evidence, language labels, references, and graph paths.

## Product North Star

Wikidata Explorer should answer one question beautifully:

> How can I start with one Wikidata entity and quickly understand the trustworthy graph around it?

Every future feature should make that path clearer, faster, more evidence-grounded, or easier to share.

## Current State

The project is now beyond a prototype. It has a working public demo, a coherent portfolio story, and a solid verification loop.

- Public Next.js 16 / React 19 app deployed on Vercel at `www.wikidataexplorer.com`.
- AI agents are feature-flagged off in public mode, with API routes failing closed and tested.
- Optional AG2 runtime supports local Python/conda or a token-protected FastAPI container through `AG2_SERVICE_URL`.
- Search supports keywords, QIDs, PIDs, linked navigation, Commons media, language/sitelink metadata, and normalized Wikidata statements.
- Relationship graph supports clickable nodes, hover previews, URL-backed depth/relationship filters, grouped-by-property and timeline evidence layouts, richer secondary-entity node previews, pinned relationship history, selected-edge evidence summaries, selected statement detail drawers, selected-path Markdown/JSON exports, and shareable selected-path export views.
- Production includes an AI-off entity comparison workflow for shared properties, unique properties, overlapping linked entities, optional three-entity property matrices, shareable comparison URLs, and shareable Markdown/JSON comparison export views.
- `main` includes CI/browser hardening: performance budgets for `/search?q=Q42`, graph rendering, light/dark visual QA coverage, deterministic Q42/Q80/Q90/Q95/Q25169/Q46248/P31 Wikidata fixtures, and a route-mocked browser fixture flow covering Wikidata, language, Commons media, no-result, missing-entity, Wikidata API outage, Commons outage, and language metadata outage responses.
- Evidence surfaces include ranks, referenced/unreferenced badges, statement detail views, qualifiers, references, data-quality summaries, review queues, formatter-aware source-link hints, browser-local and optional project-backed workspace slots with workbench sync controls, portable workspace snapshots, and safe curation exports.
- AG2 workflows support chat, selected workbench context handoff, citation-style grounding requirements, route-level grounding validation, entity summaries, graph analysis, next-entity suggestions, verification, comparison, and reports when AI mode is enabled.
- Autonomy safety policy gates read-only, draft, supervised bot, sandbox bot, and critical write-risk actions.
- Portfolio proof includes tracked screenshots, visual QA, metadata/social preview checks, favicon/site-icon coverage, production trace checks, route smoke tests, API contracts, e2e checks, GitHub Actions CI, and a standalone architecture/safety/testing/deployment case study.

## Recently Shipped

- Public domain and canonical metadata moved to `https://www.wikidataexplorer.com`.
- Facebook/Open Graph/Twitter link previews use the Millet `The Gleaners` JPEG through `/opengraph-image`.
- Site icon and favicon now use `public/images/8sprocket.jpg`, with a generated `public/favicon.ico`.
- Vercel production API route 500s were fixed by tracing the required Next runtime helper directories under the webpack build.
- `.vercelignore` now preserves `public/images/**` for deployment.
- `metadata:check` verifies canonical metadata, robots, sitemap, social preview image, favicon, and site icon.
- Recruiter-ready Q42 proof path opens Douglas Adams with a selected P31 -> Q5 graph edge, evidence depth, safe exports, and visible AI boundary.
- AI-off comparison workflow compares Q42 against a target entity such as Q80, can add a third entity such as Q25169, and exports shared/unique property notes plus property matrices.
- README now includes live deployment, CI, and visual QA links above the portfolio story.
- Timeline evidence graph layout shipped with `glayout=timeline` URL state.
- Graph node accessibility labels and keyboard-focus coverage shipped in the search interaction test.
- Graph filter tab-order checks and reduced-motion coverage shipped in the search interaction test.
- Graph filter labels/options, selected statement detail drawer coverage, and pinned relationship keyboard controls are covered in the search interaction test.
- A concise case-study doc now explains the architecture, AI safety boundary, testing strategy, and deployment tradeoffs.
- AI-enabled AG2 API success contracts now run against a mock remote service for chat, entity summary, and graph workflow routes without provider credentials.
- Dark-mode visual QA now captures home, Q42 graph, Q42 comparison, and mobile search surfaces.
- Organization fixture coverage now adds Q95/Google with headquarters, founder, inception, website, logo/media, source-link, data-quality, and graph-regression checks.
- Cross-type comparison coverage now exports a work/organization/person matrix for Q25169/Q95/Q42 and verifies shareable restore.
- Place fixture coverage now adds Q90/Paris with country, administrative region, coordinate, image/media, source-link, graph-regression, and work/organization/place comparison checks.
- Property-focused comparison exports now restore a selected property with `export=comparison-property&cprop=P...` and provide Markdown/JSON handoff text for reviewer workflows.
- Portable workspace snapshots now export and restore review task statuses, dismissed review findings, and saved AG2 run history with tested artifact validation.
- Browser-local workspace slots now save named entity workspaces using the portable snapshot format, with restore/delete controls and bounded slot validation.
- A token-protected `/api/workspaces` route now provides optional filesystem-backed project workspace slot persistence using the same sanitized portable snapshot format, with live API contracts for save/list/delete.
- The Review Queue workspace panel can load, save, and delete project workspace slots through the token-protected store when a private/self-hosted sync token is entered.
- GitHub Actions CI now uses Node 24-compatible action lines for checkout, setup-node, Chrome setup, and artifact upload, with a regression test to keep the workflow current.
- AI-enabled AG2 routes now reject ungrounded responses that lack `Grounding references` or supplied Wikidata IDs, and emit an `ag2-grounding-invalid` observability category.
- AI API routes can now deliver sanitized failure events and matching alert-rule metadata to an optional hosted monitor webhook.
- API observability now includes a tested dashboard/alert contract with category panels, severity thresholds, time windows, and runbook text on top of sanitized failure events.
- A token-protected `/api/observability/events` receiver can now accept sanitized monitor payloads, retain a bounded in-memory event window, and expose evaluated alert/dashboard snapshots for hosted smoke checks or lightweight demos.
- AI API routes now emit sanitized failure events with stable categories for disabled mode, validation, safety policy, request rate limits, OpenAI key/quota issues, AG2 service outages, Wikidata outages, and Commons outages.
- The search workbench now has a client-side error boundary with a reset/reload fallback and sanitized client failure telemetry.

## Recently Confirmed In Production

- `https://www.wikidataexplorer.com/search?q=Q42&tab=compare&compare=Q80` restores the public AI-off Q42/Q80 comparison workflow.
- Production comparison exports now include structured JSON beside Markdown notes.

## Ready For Next Production Deploy

- Performance budgets are on `main` for Q42 route readiness, graph readiness, graph node count, and DOM size.
- Light/dark visual QA is on `main` for the home page, Q42 graph, Q42 comparison, chat/agents/docs, and mobile search surfaces.
- Deterministic Q42/Q80/Q90/Q95/Q25169/Q46248/P31 Wikidata fixtures are on `main` for search, entity, graph, evidence, media, data-quality, and comparison regression coverage.
- A route-mocked browser fixture flow is on `main` for the search workbench, Q42 graph context, Q25169 related-work graph context, Q95 organization headquarters/media context, Q90 place country/media context, Commons media, language metadata, Q42/Q80 comparison JSON export, Q42/Q46248 author comparison JSON export, Q25169/Q95/Q42 cross-type comparison JSON export, Q25169/Q95/Q90 work/organization/place comparison JSON export, property-focused comparison export restore for P17, direct P31 lookup, empty/missing results, Wikidata outage states, Commons outage states, and language fallback states without live Wikidata calls.
- AI-enabled AG2 API success contracts are on `main` for `/api/chat`, `/api/entity-summary`, and `/api/ag2-workflow` through a token-authenticated mock remote service.
- The built-in observability receiver route is on `main` with live API contract coverage for fail-closed auth, accepted monitor events, sanitized snapshots, and firing alert results.
- The optional project workspace store is on `main` with live API contract coverage for bearer auth, sanitized save/list/delete, and persisted review/agent-history snapshots.
- The search workbench is on `main` with mocked browser coverage for project workspace save/delete/load controls.

## Portfolio Readiness

Current local grade: 9.7 / 10

The project is job-portfolio ready now. It shows product judgment, modern frontend engineering, linked-data depth, AI-off comparison, graph depth controls, grouped graph layout, timeline evidence layout, richer graph previews, pinned graph comparison, AI safety boundaries, CI discipline, deployment hardening, and a real public URL. The remaining gap is less about baseline readiness and more about making the research workspace feel production-deep.

Beyond 9.5:

- Shipped property-focused comparison export views for reviewer handoff across entities and properties.

To reach 10:

- Ship an optional hosted AG2 container demo now that AI-enabled routes enforce traceable, citation-style Wikidata ID references in responses.
- Add durable hosted storage behind the project-backed workspace slot API, then extend it into account-backed curation tasks and agent history.
- Configure durable production monitor storage/dashboarding for the tested observability webhook, built-in receiver, and alert contract.

## Next Priorities

### 1. Recruiter-Ready Proof Path

Status: implemented in the app; ship to production after the verification pass.

Goal: make the first five minutes of the demo obvious and impressive.

- Shipped a guided "start with Douglas Adams" proof path from the home page.
- Seeded the graph to the Q42 -> human edge through P31 so selected-edge evidence and exports are visible immediately.
- Added a compact proof panel covering graph context, evidence depth, safe exports, and the AI boundary.
- Updated README and e2e coverage so the portfolio story matches the visible workflow.

### 2. Graph Exploration Depth

Status: depth, preview, history, detail-drawer, pinned-comparison, grouped-by-property layout, timeline evidence layout, graph node accessibility, control labels/options, tab-order, keyboard-control focus, and reduced-motion coverage shipped in production; performance budgets and deterministic fixture coverage are on `main`.

Goal: make the graph the signature feature.

- Implemented graph depth controls: 1-hop statements, 2-hop evidence-linked records, and selected-property expansion.
- Implemented richer node previews from secondary entity lookups.
- Implemented pinned relationship history for selected graph relationships.
- Implemented a selected statement detail drawer for statement ID, value, data type, depth/source context, qualifiers, and references.
- Implemented multi-edge comparison views for pinned relationships.
- Implemented grouped-by-property layout mode.
- Implemented timeline evidence layout mode for date-heavy relationship evidence.
- Implemented accessible graph node labels and keyboard-focus coverage.
- Implemented graph control label/option, tab-order, pinned-control focus, statement drawer, and reduced-motion coverage.
- Implemented performance budgets for `/search?q=Q42` and graph rendering on `main`.
- Implemented deterministic Wikidata fixtures and route-mocked browser coverage for graph/search/evidence/media/language regression on `main`.
- Added broader seeded author fixture coverage with Q46248 for richer graph/comparison regression.
- Added organization fixture coverage with Q95 for non-biographical graph/media/evidence regression.
- Added place fixture coverage with Q90 for geographic graph/media/evidence regression.
- Added property-focused comparison export restore coverage for selected comparison properties.
- Keep graph URL state stable for filters, selected focus, and future export views.

### 3. Entity Comparison

Status: shipped in production as a public AI-off two-entity comparison slice, with optional three-entity property matrices on `main`; shareable comparison URLs and Markdown/JSON exports are covered by visual/browser QA.

Goal: support research workflows beyond single-entity browsing.

- Shipped two-entity comparison from the workbench in public AI-off mode.
- Shipped shared properties, source-only properties, target-only properties, overlapping related entities, and Markdown comparison exports.
- Shipped optional three-entity comparison with a property matrix for source, target, and third entity statement counts.
- Covered comparison with deterministic utility tests and browser e2e coverage.
- Shipped shareable comparison target URL state for links such as `/search?q=Q42&tab=compare&compare=Q80`.
- Implemented visual QA coverage and a tracked portfolio screenshot for the comparison tab on `main`.
- Shipped structured JSON comparison exports and URL-backed export views for tool handoff and repeatable research notes.
- Shipped seeded examples such as `Q42` vs another author (`Q46248`) and property-focused examples such as `P31`.
- Shipped a cross-type Q25169/Q95/Q42 comparison example covering a work, organization, and person.
- Shipped a cross-type Q25169/Q95/Q90 comparison example covering a work, organization, and place.
- Shipped URL-backed property-focused comparison export views with Markdown/JSON handoff for selected properties.

### 4. Evidence And Trust

Goal: help users evaluate data quality, not just browse facts.

- Extended the graph statement detail drawer pattern into the full statements tab.
- Added visible badges for referenced vs unreferenced claims.
- Extended source-link coverage into full statement detail views.
- Added fallback support for uncommon external-ID formatter patterns beyond `$1`.
- Shipped portable workspace snapshots for review task statuses, dismissed findings, and saved AG2 run history.
- Shipped named browser-local workspace slots as a bounded, restorable project-slot step before account-backed storage.
- Shipped an optional token-protected project workspace store for sanitized saved slots on a durable filesystem mount.
- Shipped Review Queue UI controls for project workspace load/save/delete when a private/self-hosted token is available.
- Promote review queue findings into the project workspace store, then into account-backed source-backed curation tasks once a user/project identity layer exists.

### 5. AG2 Assistant Context

Goal: make AI assistance visibly grounded in selected Wikidata context.

- Shipped selected graph nodes, selected statements, and selected path exports into the full AG2 chat surface.
- Shipped visible workbench-to-chat handoff with bounded entity, statement, graph-focus, and selected-path export context.
- Shipped citation-style grounding requirements for AG2 chat, summaries, graph analysis, suggestions, verification, comparison, and reports.
- Shipped route-level AG2 response grounding validation for `Grounding references` and supplied Wikidata IDs, including an observability alert category for invalid grounding.
- Shipped AI-enabled API route success contracts through a token-authenticated mock AG2 remote service for chat, entity summaries, and graph workflow responses.
- Shipped portable workspace snapshots that can carry saved AG2 run history between browser sessions.
- Persist agent result history through the project workspace store first, then beyond portable/browser artifacts once a database or account layer is introduced.
- Deploy the AG2 service container to a public/private host for an optional AI-enabled demo.
- Expand safety copy and policy UI for future live bot-ready actions, source requirements, and human approval states.

## Testing And Quality

Keep these green before shipping code changes:

- `npm run verify`
- `npm run trace:check`
- `npm run metadata:check`
- `npm run smoke`
- `npm run api:contracts`
- `npm run api:contracts:ag2`
- `npm run e2e`
- `npm run perf:check`
- `npm run visual:qa`

Next quality improvements:

- Keep organization, author, work, person, place, and property fixtures green as the workbench model evolves.
- Keep light/dark visual QA green for portfolio-critical routes.
- Keep graph accessibility checks green for control labels, keyboard navigation, tab order, statement drawers, pinned history, and reduced-motion behavior.
- Keep `/search?q=Q42` performance budgets and shared comparison URL restore green as graph/comparison features expand.
- Keep AI-enabled AG2 success contracts green as chat/workflow payloads evolve.

## Deployment And Operations

Current public mode:

- Vercel app runs with `NEXT_PUBLIC_ENABLE_AI_AGENTS=false` and `ENABLE_AI_AGENTS=false`.
- `NEXT_PUBLIC_SITE_URL` should stay aligned with `https://www.wikidataexplorer.com`.
- Public AI API routes should return the tested disabled response in public mode.
- `npm run trace:check` should stay green so deployed API routes include required Next runtime helpers without bundling local repo clutter.

AI-enabled future mode:

- Deploy `agents/Dockerfile` to a container host such as Render, Railway, Fly, or a private VM.
- Store provider credentials in the AG2 service environment, not in public client code.
- Set the same 32+ character `AG2_SERVICE_TOKEN` in Vercel and the AG2 service host.
- Enable `NEXT_PUBLIC_ENABLE_AI_AGENTS=true`, `ENABLE_AI_AGENTS=true`, and `AG2_SERVICE_URL=https://...` only for intentional AI-enabled demos.
- Keep FastAPI docs disabled in production with `AG2_ENABLE_DOCS=false`.

Observability:

- Shipped lightweight server logging for AI route failures without leaking prompts, keys, or sensitive context.
- Shipped a client-side error boundary around the explorer workflow with reset/reload recovery and sanitized client failure telemetry.
- Track API error categories: Wikidata unavailable, Commons unavailable, AG2 disabled, request validation, safety policy, request rate limit, OpenAI key missing, OpenAI quota/rate limit, and AG2 service unavailable.
- Track AG2 grounding invalid responses as a critical alert category before any public AI-enabled demo traffic.
- Shipped optional hosted monitor webhook delivery for sanitized API failure events and matching alert-rule metadata.
- Shipped a token-protected built-in monitor receiver with bounded recent-event retention and alert/dashboard snapshots.
- Shipped live API contract coverage for the built-in monitor receiver's bearer auth, event ingestion, sanitized snapshot, and alert firing behavior.
- Shipped a tested dashboard/alert rule contract for category panels, severity thresholds, alert windows, and runbook text; next step is configuring durable hosted production storage/dashboarding.

## Maintenance

- Monitor Next.js advisories and Vercel runtime behavior, especially while using Next 16 with webpack production builds.
- Keep React, Next, AG2, Python container dependencies, Playwright Core, and GitHub Actions current; CI action refs now have a Node 24-compatible regression check.
- Keep screenshots fresh after visual design changes.
- Keep ignored local research artifacts out of git.
- Periodically rerun the public-domain metadata/smoke/API checks after deployment changes.

## Milestones

### Milestone 1: Public Portfolio Launch

Status: shipped

- Public Vercel deployment with AI disabled by default.
- Canonical domain, metadata, robots, sitemap, social preview image, site icon, and favicon.
- CI, trace checks, smoke/API/e2e/visual QA, and live public metadata checks.

### Milestone 2: Research-Grade Graph

Status: in progress

- Shipped: graph filters, depth controls, grouped-by-property layout, timeline evidence layout, richer node previews, pinned relationship history/comparison, selected-edge evidence, selected statement detail drawer, selected-path exports, graph focus URL state.
- On `main`: performance budgets for `/search?q=Q42` and graph rendering, plus accessibility checks for graph control labels/options, keyboard focus order, pinned controls, statement drawer content, and reduced-motion behavior.
- On `main`: deterministic Wikidata fixtures plus route-mocked browser coverage for search/entity/graph/evidence/media/language, organization graph/media coverage, place graph/media coverage, author comparison, a related-work graph path, and basic error-state regression.
- On `main`: cross-type comparison coverage for work/organization/person and work/organization/place mixes.
- On `main`: property-focused comparison export restore for selected properties.

### Milestone 3: Comparison And Shareable Research Outputs

Status: in progress

- Shipped: selected graph path Markdown/JSON exports, URL-backed selected-path export views, safe curation exports, public AI-off two-entity comparison UI, optional three-entity property matrices, and Markdown comparison exports.
- Shipped in production: shareable comparison target URLs, structured JSON comparison exports, and URL-backed comparison export views for restored AI-off comparison links.
- On `main`: property-focused comparison export views with `cprop` URL state and Markdown/JSON handoff.
- On `main`: comparison-tab visual QA coverage.

### Milestone 4: Grounded AI Research Assistant

Status: partially shipped

- Shipped: feature-flagged AG2 routes, local/container bridge, safety policy, remote service contract, disabled public mode, and mock-service success contracts for enabled API routes.
- Shipped: route-level citation-style response validation for enabled AG2 route outputs.
- Next: hosted optional AG2 demo using the validated remote-service path.

### Milestone 5: Research Workspace

Status: in progress

- Shipped: portable workspace snapshots and named browser-local workspace slots for review task statuses, dismissed findings, and saved AG2 run history.
- Shipped: optional token-protected project workspace slot persistence and workbench sync controls for sanitized portable snapshots.
- Next: account-backed persisted curation tasks and agent history.
- Broader accessibility and performance budgets suitable for a production-facing research tool as stored workspace features arrive.
