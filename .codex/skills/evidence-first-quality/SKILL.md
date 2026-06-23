---
name: evidence-first-quality
description: Project-scoped quality implementation workflow for Wikidata Explorer. Use when Codex is asked to raise project quality, work on a roadmap item, polish portfolio readiness, add or fix features, harden AG2 agents, graph, search, evidence, or safety flows, update docs/screenshots, or verify a change before shipping.
---

# Evidence First Quality

## Purpose

Improve Wikidata Explorer in small portfolio-grade slices with proof. Pair each implementation with the clearest evidence that it works: focused tests, live checks, screenshots, docs updates, or API contract checks.

## Choose This Skill

- Prefer `audit-wikidata-quality` when the user only asks to grade, review, or find weak spots.
- Use this skill when the user asks to implement, polish, harden, continue the roadmap, raise the score, or prepare a quality slice for shipping.
- Invoke the `ship` skill after this workflow when the user asks to stage, commit, sync, and push.

## Workflow

1. Establish the baseline.
   - Run `git status -sb` and preserve unrelated worktree changes.
   - Read the files closest to the requested change before editing.
   - Read `package.json`, `README.md`, or `ROADMAP.md` only when scripts, docs, or portfolio claims may be affected.
   - Use the user's local dev server URL when provided; otherwise only run browser checks when a server is already available or the task requires starting one.

2. Pick a focused quality slice.
   - Prefer issues a recruiter or user can notice: broken flows, unclear nav, stale docs, weak source/evidence display, ungrounded agent behavior, missing interaction tests, visual regressions, or safety gaps.
   - Define the expected evidence before editing.
   - Keep the change small enough that the verification story stays clear.

3. Implement with local patterns.
   - Follow existing component, API, script, and test structure.
   - Keep AG2 action changes aligned across `app/search/page.tsx`, `app/api/ag2-workflow/route.ts`, `lib/ag2.ts`, `agents/wikidata_ag2_agent.py`, `lib/autonomy-safety.mjs`, and contract tests when those surfaces are involved.
   - Avoid dependency churn unless the user requested an upgrade or the fix clearly requires it.
   - Update docs only for behavior, scripts, screenshots, deployment notes, or roadmap status that actually changed.

4. Verify by blast radius.
   - Helper or export logic: run the relevant `node scripts/test-*.mjs` check or `npm run test`.
   - API or agent contract changes: run `npm run api:contracts` and any targeted AG2 tests.
   - Search, graph, or nav UI changes: run `npm run smoke` and `npm run e2e` when a local server is available.
   - Visual or screenshot-facing changes: run `npm run visual:qa` and inspect the generated screenshots.
   - Release-quality slices: run `npm run verify`, then any targeted smoke, e2e, visual, or trace checks that apply.

5. Report quality evidence.
   - State the user-visible improvement.
   - List the checks that passed or explain what could not be run.
   - Mention any remaining risk and the next highest-leverage quality improvement.
   - If the user asks for a score, connect the change to the portfolio grade honestly.

## Quality Bar

- The first screen and nav make the product value obvious.
- `/search` handles QIDs, PIDs, empty states, errors, and linked navigation reliably.
- The graph helps users inspect relationships through selection, hover, filters, or edge details.
- AI and AG2 output is visibly grounded in selected entity, graph focus, IDs, references, qualifiers, and uncertainty.
- Autonomy features show risk, dry-run, review gates, and no hidden external writes.
- Evidence, references, qualifiers, ranks, and curation exports are strong enough to show real Wikidata depth.
- Tests, docs, screenshots, and roadmap claims match the current product.

## Done Criteria

A quality slice is done when the selected risk is clearly reduced, verification evidence matches the change, docs are not stale, and the user can understand how the work improves the portfolio project.
