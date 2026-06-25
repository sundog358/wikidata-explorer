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
- Relationship graph supports clickable nodes, hover previews, URL-backed depth/relationship filters, grouped-by-property and timeline evidence layouts, richer secondary-entity node previews, pinned relationship history, selected-edge evidence summaries, selected statement detail drawers, and selected-path Markdown/JSON exports.
- Production includes an AI-off entity comparison workflow for shared properties, unique properties, overlapping linked entities, and Markdown comparison exports.
- The current local branch adds performance budgets for `/search?q=Q42`, graph rendering, shareable comparison target URLs, comparison-tab visual QA coverage, structured JSON comparison exports, deterministic Wikidata fixtures, and a route-mocked browser fixture flow covering Wikidata, language, and Commons media responses.
- Evidence surfaces include ranks, qualifiers, references, data-quality summaries, review queues, source-link hints, and safe curation exports.
- AG2 workflows support chat, entity summaries, graph analysis, next-entity suggestions, verification, comparison, and reports when AI mode is enabled.
- Autonomy safety policy gates read-only, draft, supervised bot, sandbox bot, and critical write-risk actions.
- Portfolio proof includes tracked screenshots, visual QA, metadata/social preview checks, favicon/site-icon coverage, production trace checks, route smoke tests, API contracts, e2e checks, and GitHub Actions CI.

## Recently Shipped

- Public domain and canonical metadata moved to `https://www.wikidataexplorer.com`.
- Facebook/Open Graph/Twitter link previews use the Millet `The Gleaners` JPEG through `/opengraph-image`.
- Site icon and favicon now use `public/images/8sprocket.jpg`, with a generated `public/favicon.ico`.
- Vercel production API route 500s were fixed by tracing the required Next runtime helper directories under the webpack build.
- `.vercelignore` now preserves `public/images/**` for deployment.
- `metadata:check` verifies canonical metadata, robots, sitemap, social preview image, favicon, and site icon.
- Recruiter-ready Q42 proof path opens Douglas Adams with a selected P31 -> Q5 graph edge, evidence depth, safe exports, and visible AI boundary.
- AI-off comparison workflow compares Q42 against a target entity such as Q80, with shared/unique properties, overlapping linked entities, and Markdown notes.
- README now includes live deployment, CI, and visual QA links above the portfolio story.
- Timeline evidence graph layout shipped with `glayout=timeline` URL state.
- Graph node accessibility labels and keyboard-focus coverage shipped in the search interaction test.
- Graph filter tab-order checks and reduced-motion coverage shipped in the search interaction test.

## Ready For Next Production Deploy

- Performance budgets are implemented locally for Q42 route readiness, graph readiness, graph node count, and DOM size.
- Comparison target URL state is implemented locally, so `/search?q=Q42&tab=compare&compare=Q80` restores the public AI-off comparison workflow.
- Comparison-tab visual QA is implemented locally and can refresh the tracked portfolio screenshot.
- Structured comparison JSON exports are implemented locally beside Markdown comparison notes.
- Deterministic Q42/Q80/P31 Wikidata fixtures are implemented locally for search, entity, graph, evidence, and comparison regression coverage.
- A route-mocked browser fixture flow is implemented locally for the search workbench, Q42 graph context, Commons media, language metadata, Q42/Q80 comparison JSON export, and direct P31 lookup without live Wikidata calls.

## Portfolio Readiness

Current local grade: 9.25 / 10

The project is job-portfolio ready now. It shows product judgment, modern frontend engineering, linked-data depth, AI-off comparison, graph depth controls, grouped graph layout, timeline evidence layout, richer graph previews, pinned graph comparison, AI safety boundaries, CI discipline, deployment hardening, and a real public URL. The remaining gap is less about baseline readiness and more about making the research workspace feel production-deep.

To reach 9.5:

- Add accessibility checks for the new graph layout/depth controls, pinned comparison, and statement drawer.
- Add accessibility checks for keyboard graph navigation, focus order, and reduced-motion behavior.
- Ship performance budgets for `/search?q=Q42`, graph rendering, and shared comparison URL restore.

To reach 10:

- Ship an optional hosted AG2 container demo with traceable, citation-style Wikidata ID references in responses.
- Expand route-mocked fixture coverage to additional seeded entities and negative/error states.
- Add a concise case-study page or doc that explains the architecture, AI safety boundary, testing strategy, and deployment tradeoffs.

## Next Priorities

### 1. Recruiter-Ready Proof Path

Status: implemented in the app; ship to production after the verification pass.

Goal: make the first five minutes of the demo obvious and impressive.

- Shipped a guided "start with Douglas Adams" proof path from the home page.
- Seeded the graph to the Q42 -> human edge through P31 so selected-edge evidence and exports are visible immediately.
- Added a compact proof panel covering graph context, evidence depth, safe exports, and the AI boundary.
- Updated README and e2e coverage so the portfolio story matches the visible workflow.

### 2. Graph Exploration Depth

Status: depth, preview, history, detail-drawer, pinned-comparison, grouped-by-property layout, timeline evidence layout, graph node accessibility, tab-order, and reduced-motion coverage shipped in production; performance budgets implemented locally.

Goal: make the graph the signature feature.

- Implemented graph depth controls: 1-hop statements, 2-hop evidence-linked records, and selected-property expansion.
- Implemented richer node previews from secondary entity lookups.
- Implemented pinned relationship history for selected graph relationships.
- Implemented a selected statement detail drawer for statement ID, value, data type, depth/source context, qualifiers, and references.
- Implemented multi-edge comparison views for pinned relationships.
- Implemented grouped-by-property layout mode.
- Implemented timeline evidence layout mode for date-heavy relationship evidence.
- Implemented accessible graph node labels and keyboard-focus coverage.
- Implemented tab-order and reduced-motion coverage.
- Implemented performance budgets for `/search?q=Q42` and graph rendering locally.
- Implemented deterministic Wikidata fixtures and route-mocked browser coverage for graph/search/evidence/media/language regression locally.
- Next: deploy performance budgets and continue broader fixture coverage for additional entities.
- Keep graph URL state stable for filters, selected focus, and future export views.

### 3. Entity Comparison

Status: shipped in production as a public AI-off two-entity comparison slice; shareable comparison target URLs, comparison visual QA, and structured JSON exports implemented locally.

Goal: support research workflows beyond single-entity browsing.

- Shipped two-entity comparison from the workbench in public AI-off mode.
- Shipped shared properties, source-only properties, target-only properties, overlapping related entities, and Markdown comparison exports.
- Covered comparison with deterministic utility tests and browser e2e coverage.
- Implemented shareable comparison target URL state locally for links such as `/search?q=Q42&tab=compare&compare=Q80`.
- Implemented visual QA coverage and a tracked portfolio screenshot for the comparison tab locally.
- Implemented structured JSON comparison exports locally for tool handoff and repeatable research notes.
- Next: compare three entities side by side.
- Next: add seeded examples such as `Q42` vs another author and property-focused examples such as `P31`.
- Next: add shareable export views.

### 4. Evidence And Trust

Goal: help users evaluate data quality, not just browse facts.

- Extend the new graph statement detail drawer pattern into the full statements tab.
- Add visible badges for referenced vs unreferenced claims.
- Extend source-link coverage into full statement detail views.
- Add fallback support for uncommon external-ID formatter patterns beyond `$1`.
- Promote review queue findings into persisted, source-backed curation tasks once a storage layer exists.

### 5. AG2 Assistant Context

Goal: make AI assistance visibly grounded in selected Wikidata context.

- Send selected graph nodes, selected statements, and selected path exports into the full AG2 chat surface.
- Add citation-style references to Wikidata IDs, statement IDs, and source URLs in AI responses.
- Persist agent result history beyond browser-local storage once a database layer is introduced.
- Deploy the AG2 service container to a public/private host for an optional AI-enabled demo.
- Expand safety copy and policy UI for future live bot-ready actions, source requirements, and human approval states.

## Testing And Quality

Keep these green before shipping code changes:

- `npm run verify`
- `npm run trace:check`
- `npm run metadata:check`
- `npm run smoke`
- `npm run api:contracts`
- `npm run e2e`
- `npm run perf:check`
- `npm run visual:qa`

Next quality improvements:

- Expand route-mocked fixtures to additional seeded entities plus negative/error states.
- Add visual QA for dark mode.
- Add accessibility checks for keyboard graph navigation and tab order.
- Keep `/search?q=Q42` performance budgets and shared comparison URL restore green as graph/comparison features expand.
- Expand API contract tests for successful mocked AG2 responses once a route-mocking harness exists.

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

- Add lightweight server logging for AI route failures without leaking prompts, keys, or sensitive context.
- Add a client-side error boundary around the explorer workflow.
- Track API error categories: Wikidata unavailable, Commons unavailable, AG2 disabled, OpenAI key missing, OpenAI quota/rate limit, and AG2 service unavailable.

## Maintenance

- Monitor Next.js advisories and Vercel runtime behavior, especially while using Next 16 with webpack production builds.
- Keep React, Next, AG2, Python container dependencies, Playwright Core, and GitHub Actions current.
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
- Ready for deploy: performance budgets for `/search?q=Q42` and graph rendering.
- Ready for deploy: deterministic Wikidata fixtures plus route-mocked browser coverage for search/entity/graph/evidence/media/language regression.
- Next: additional seeded entities and shareable export views.

### Milestone 3: Comparison And Shareable Research Outputs

Status: in progress

- Shipped: selected graph path Markdown/JSON exports, safe curation exports, public AI-off two-entity comparison UI, and Markdown comparison exports.
- Ready for deploy: shareable comparison target URLs, comparison-tab visual QA, and structured JSON comparison exports for restored AI-off comparison links.
- Next: three-entity comparison and shareable export views.

### Milestone 4: Grounded AI Research Assistant

Status: partially shipped

- Shipped: feature-flagged AG2 routes, local/container bridge, safety policy, remote service contract, disabled public mode.
- Next: hosted optional AG2 demo, citation-style response grounding, selected graph/path context in chat.

### Milestone 5: Research Workspace

Status: later

- Persisted curation tasks.
- Persisted agent history.
- Optional project/workspace storage.
- Accessibility and performance budgets suitable for a production-facing research tool.
