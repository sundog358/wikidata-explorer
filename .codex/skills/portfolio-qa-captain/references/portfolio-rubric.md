# Portfolio Rubric

Use this rubric for job-portfolio scoring or deeper quality planning.

## Score Bands

- `9.5-10`: Deployed, polished, tested, visually distinctive, and clearly valuable. AI output is grounded, evidence is transparent, screenshots are current, and the README reads like a concise case study.
- `9.0-9.4`: Strong portfolio project with a clear product story, reliable core workflows, meaningful tests, visual QA evidence, and only minor polish gaps.
- `8.0-8.9`: Solid and demoable, but missing one or two recruiter-visible strengths such as deployment, screenshots, stronger e2e coverage, or a standout graph/agent feature.
- `7.0-7.9`: Promising but uneven. Core functionality works, yet docs, tests, UX polish, or reliability do not fully support the claims.
- `<7`: The project needs fundamental reliability, presentation, or scope cleanup before it should lead a portfolio.

## Review Dimensions

- Product clarity: The first screen, nav, and README explain why the project exists.
- Search reliability: QIDs, PIDs, empty states, errors, and shared URLs behave predictably.
- Graph quality: Selection, hover previews, filters, edge details, and evidence make relationships inspectable.
- AI grounding: Agent actions cite selected entity, graph focus, Wikidata IDs, references, uncertainty, and limits.
- Evidence depth: Statements, references, qualifiers, ranks, source links, and export summaries show real Wikidata fluency.
- Safety: Autonomy actions expose risk, dry-run output, review gates, and no hidden external writes.
- Visual polish: Desktop and mobile layouts avoid overlap, jitter, awkward whitespace, and stale screenshot claims.
- Tests: Unit, contract, smoke, e2e, visual QA, trace, and CI checks cover the changed behavior.
- Documentation: README, roadmap, screenshots, deployment notes, and scripts match the current app.
- Maintainability: Changes follow local patterns and keep app, API, agent, script, and docs contracts aligned.

## Finding Format

Report findings in priority order:

- `P0`: Broken demo, data loss, security issue, or impossible core workflow.
- `P1`: Recruiter-visible defect, unreliable major workflow, stale portfolio claim, or ungrounded AI output.
- `P2`: Polish, coverage, or docs gap that would improve confidence but does not block the demo.

Prefer a short fix plan with one high-impact slice over a long backlog.
