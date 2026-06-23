---
name: audit-wikidata-quality
description: Quality audit and hardening workflow for this Wikidata Explorer repository. Use when Codex is asked to grade the project, improve portfolio quality, review readiness before shipping, find weak spots, harden AG2 agents, validate graph/search behavior, improve UX/accessibility, increase tests, check docs accuracy, or turn a roadmap item into a quality-focused fix.
---

# Audit Wikidata Quality

## Purpose

Audit the project like a portfolio reviewer and a reliability engineer. Find the highest-leverage quality gap, fix it when practical, and verify with evidence rather than vibes.

## Quality Rubric

Score the project across these dimensions before choosing work:

- Product clarity: the first screen and nav make the app's value obvious.
- Search reliability: `/search`, QIDs, PIDs, empty/error states, and linked navigation behave predictably.
- Graph usefulness: nodes, edges, hover/selection details, filters, and agent actions help users understand relationships.
- AG2 grounding: agent outputs are tied to visible Wikidata entity context, IDs, references, qualifiers, and caveats.
- Safety: autonomy actions have explicit risk levels, dry-run/review gates, and no hidden external writes.
- Evidence depth: statements, qualifiers, references, ranks, data-quality warnings, and export summaries are visible.
- UX/accessibility: controls have labels, keyboard/focus states work, text fits, and mobile layouts remain usable.
- Tests and checks: unit, contract, smoke, e2e, visual QA, and trace checks cover the changed behavior.
- Docs and portfolio story: README, roadmap, screenshots, and deployment notes match the current product.
- Maintainability: code follows existing patterns, avoids broad rewrites, and keeps contracts aligned across app/lib/agents/scripts.

## Workflow

1. Establish the baseline.
   - Run `git status -sb` and preserve unrelated or in-progress changes.
   - Inspect `README.md`, `ROADMAP.md`, `package.json`, and files relevant to the requested quality area.
   - If a dev server is available, verify the live route or UI when the issue is visual or interactive.

2. Identify the weakest quality risk.
   - Prefer bugs, broken flows, misleading docs, missing tests, ungrounded agent behavior, and UX issues visible to a recruiter.
   - For scoring requests, give a 1-10 grade with concrete blockers to the next half-point.
   - For implementation requests, fix the highest-impact issue that fits the current turn.

3. Apply a focused fix.
   - Keep edits scoped to the quality gap.
   - Keep AG2 action names aligned in `app/search/page.tsx`, `app/api/ag2-workflow/route.ts`, `lib/ag2.ts`, `agents/wikidata_ag2_agent.py`, `lib/autonomy-safety.mjs`, and contract tests.
   - For graph/search UI changes, verify layout and interaction at desktop and mobile sizes when possible.
   - For docs changes, update only claims that changed or evidence that helps portfolio review.

4. Verify by risk level.
   - Small source changes: `npm run lint` and the relevant `node scripts/test-*.mjs` check.
   - API or agent changes: `npm run test` and `npm run api:contracts`.
   - UI route changes: `npm run smoke` and `npm run e2e` when a local server is running.
   - Visual changes: `npm run visual:qa` and inspect the screenshots when the result matters.
   - Release-quality changes: `npm run verify`, then any targeted smoke/e2e/visual/trace gates that apply.

5. Report with a quality lens.
   - State the before/after quality impact.
   - List verification commands that passed or explain what could not be run.
   - Mention remaining risks and the next highest-leverage improvement.
   - If the user asks to ship, invoke the `ship` skill and follow its locked workflow.

## Done Criteria

A quality slice is done when the selected risk is resolved or clearly reduced, tests or live checks prove the result, docs are not stale, and the user can understand how the change raises the portfolio score.