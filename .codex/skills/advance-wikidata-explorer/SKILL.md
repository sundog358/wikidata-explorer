---
name: advance-wikidata-explorer
description: Focused workflow for improving this Wikidata Explorer repository. Use when Codex is asked to advance the roadmap, raise the portfolio score, improve AG2 agents, graph UX, safety/autonomy layers, docs, tests, visual QA, smoke/e2e coverage, or prepare a verified implementation slice in this repo.
---

# Advance Wikidata Explorer

## Purpose

Move the project forward in small, shippable slices without rediscovering the repo every time. Favor changes that improve portfolio value, agent usefulness, reliability, and evidence that the app works.

## Workflow

1. Orient first.
   - Run `git status -sb` and inspect only files relevant to the request.
   - Check `ROADMAP.md`, `README.md`, and `package.json` when the task concerns direction, docs, or validation.
   - Treat existing uncommitted changes as user or in-progress work; preserve them.

2. Pick one focused slice unless the user gave a specific task.
   - Prefer visible user value: graph polish, AG2 agent grounding, safety review, evidence display, saved runs, export flows, docs, or tests.
   - Keep the slice small enough to verify in the current turn.
   - If the user asks for a score improvement, target the fastest portfolio lift with a clear before/after.

3. Edit in the local style.
   - Use existing app patterns in `app/`, `components/`, `lib/`, `agents/`, and `scripts/`.
   - Keep UI dense and workbench-oriented, not marketing-like.
   - Do not add broad abstractions unless they remove real duplication.

4. Update the evidence trail.
   - Add or adjust tests for behavior changes.
   - Update `README.md` or `ROADMAP.md` only when the public story or direction changed.
   - For AG2 work, keep API contracts, autonomy safety rules, and the Python bridge aligned.

5. Verify with the narrowest useful gate, then broaden before shipping.
   - Source/contracts: `npm run lint`, `npm run test`, `npm run api:contracts`.
   - Build confidence: `npm run verify`.
   - App routes: `npm run smoke`.
   - Browser flows: `npm run e2e`.
   - Visual changes: `npm run visual:qa`.
   - Deployment trace or portfolio evidence: `npm run trace:check`.

6. Report clearly.
   - Name what changed, what passed, and any remaining risk.
   - If the user says `ship`, `ship now`, or asks to stage/commit/push, use the `ship` skill and follow its locked order.

## Project Map

- `app/search/page.tsx`: primary workbench, graph, agent action controls, exports.
- `app/agents/page.tsx`: top-level AG2 specialist agent landing page.
- `app/api/ag2-workflow/route.ts`: workflow API contract and safety gate entrypoint.
- `lib/ag2.ts`: Node bridge into the Python AG2 runner.
- `agents/wikidata_ag2_agent.py`: AG2 specialist prompts and model invocation.
- `lib/autonomy-safety.mjs`: action policy and autonomy guardrails.
- `scripts/test-*.mjs`: fast regression and contract checks.
- `docs/screenshots/`: visual QA evidence used by README/portfolio material.

## Done Criteria

A slice is done when the UI or behavior works locally, the relevant tests pass, docs are current if user-facing claims changed, and the final response includes enough verification detail for the user to trust the change.