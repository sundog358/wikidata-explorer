# 🗺️ Wikidata Explorer Roadmap

This roadmap is organized around the best next direction for the project: turn Wikidata Explorer from a polished portfolio app into a credible linked-data research workspace.

## 🎯 Product Vision

Wikidata Explorer should help researchers, students, developers, and cultural-data practitioners move from a topic to trustworthy graph context quickly.

The best version of the project is not just a prettier Wikidata search UI. It is a focused workspace for:

- 🔎 finding entities and properties
- 🧾 understanding statement evidence and structure
- 🕸️ exploring relationships visually
- 🤖 asking AI-assisted research questions against explicit context
- 📤 exporting or sharing useful paths through the graph

## ✅ Current Foundation

The project already has a strong base:

- Next.js 16 App Router and React 19 stable
- AI SDK 6 research assistant with server-side OpenAI key handling
- Wikidata Action API, Wikibase REST API, and Commons media integration
- Clickable relationship graph for selected entities
- Stable English label fallback for multilingual Wikidata records
- Route smoke checks, unit tests, graph-click e2e test, visual QA screenshots, and GitHub Actions CI
- Cleaned repo presentation with tracked portfolio screenshots

## 🚦 Near-Term Priorities

### 1. Graph Exploration Depth

Goal: make the graph the signature feature.

- Add graph node hover previews with property, label, ID, and description
- Add graph filters for relationship type, statement rank, item/property type, and media presence
- Add graph depth controls: 1-hop, 2-hop, and selected-property expansion
- Add a side panel for selected graph edges and statement details
- Add layout modes: radial, grouped by property, and timeline-like for date-heavy entities

### 2. Entity Comparison

Goal: support research workflows beyond single-entity browsing.

- Compare two or three entities side by side
- Highlight shared properties, unique statements, and overlapping related entities
- Add quick comparison examples such as `Q42` vs another author or `P31` vs related properties
- Export comparison summaries as Markdown

### 3. AI Assistant Context

Goal: make AI assistance grounded in visible Wikidata context.

- Send selected entity summary, graph nodes, and selected statements as explicit chat context
- Add citation-style references to Wikidata IDs in AI responses
- Add a “summarize this entity” action from the search page
- Add a “suggest next entities to inspect” action from the graph
- Add safety copy that distinguishes Wikidata-derived facts from model-generated reasoning

### 4. Evidence And Trust

Goal: help users evaluate data quality, not just browse facts.

- Render references and qualifiers in a clearer statement detail drawer
- Surface statement ranks: preferred, normal, deprecated
- Add badges for referenced vs unreferenced claims
- Add source links where references include URLs, identifiers, or stated-in records
- Add a data-quality summary for each entity

## 🧪 Testing And Quality Roadmap

### Immediate

- Keep `npm run verify`, `npm run smoke`, `npm run e2e`, and `npm run visual:qa` green
- Add unit coverage for Wikidata normalization helpers beyond ID and sitelink utilities
- Add e2e coverage for direct PID lookup such as `/search?q=P31`
- Add e2e coverage for chat validation and missing-key behavior

### Next

- Add mocked Wikidata fixtures for deterministic tests
- Add visual QA for dark mode
- Add visual QA for the comparison view once implemented
- Upload visual QA screenshots as CI artifacts, already configured in GitHub Actions

### Later

- Add performance budgets for `/search?q=Q42`
- Add accessibility checks for keyboard graph navigation and tab order
- Add API contract tests for `/api/chat`

## 🚀 Deployment Roadmap

### Vercel Or Similar Hosting

- Configure production environment variables for `OPENAI_API_KEY` and optional `OPENAI_MODEL`
- Add a deployment badge and production URL to the README
- Add basic metadata and social preview image
- Confirm Wikidata and Commons API calls behave correctly from deployed origin

### Observability

- Add lightweight server logging for chat route failures without leaking prompts or keys
- Add client-side error boundary around the explorer workflow
- Track API error categories: Wikidata unavailable, Commons unavailable, OpenAI key missing, OpenAI quota/rate limit

## 🧹 Maintenance Roadmap

- Monitor Next.js audit advisories; avoid npm’s bad forced downgrade path for the current internal PostCSS advisory
- Keep React, Next, AI SDK, and Playwright Core current on a regular schedule
- Keep screenshots fresh after visual design changes
- Keep ignored local research artifacts out of git

## 🏁 Suggested Milestones

### Milestone 1: Research-Grade Graph

- Graph filters
- Node previews
- Edge detail drawer
- Improved statement/reference display

### Milestone 2: Grounded AI Research Assistant

- Context-aware prompts from selected entity
- Wikidata ID references in assistant responses
- “Summarize entity” and “suggest next nodes” actions

### Milestone 3: Shareable Research Outputs

- Export selected entity summary as Markdown
- Export graph path as Markdown or JSON
- Shareable URL state for selected entity, tab, and graph filters

### Milestone 4: Public Portfolio Launch

- Production deployment
- README badges and deployment link
- Short case-study section explaining architecture, tradeoffs, and testing strategy
- CI artifacts and screenshots linked from README

## 📌 Product North Star

The project should answer one question beautifully:

> “How can I start with one Wikidata entity and quickly understand the trustworthy graph around it?”

Every future feature should make that path clearer, faster, more grounded, or easier to share.
