---
name: portfolio-qa-captain
description: Recruiter-facing visual QA and portfolio polish workflow for Wikidata Explorer. Use when Codex is asked to improve project quality, inspect screenshots, run visual QA, check console or hydration errors, validate responsive UI, update portfolio evidence, review docs/screenshots, or prepare the app for a stronger job-portfolio presentation.
---

# Portfolio QA Captain

## Purpose

Make Wikidata Explorer feel deliberate, polished, and defensible as a portfolio project. Focus on visible product quality, trustworthy evidence, and the checks a reviewer would notice before they read the code.

## Workflow

1. Establish the surface.
   - Run `git status -sb` and preserve existing unrelated changes.
   - Read `README.md`, `ROADMAP.md`, `package.json`, and the route/component files closest to the requested QA area.
   - Use the user's provided dev server URL when available. If no URL is provided, inspect scripts before starting a server.

2. Define the QA pass.
   - For visual work, cover desktop and mobile widths.
   - For browser work, check console errors, hydration warnings, broken navigation, loading states, and obvious layout overlap.
   - For portfolio readiness, check whether screenshots, README claims, roadmap status, and visible product behavior agree.
   - For AG2 or graph work, verify that the selected entity, graph focus, evidence, and AI action context are visible and grounded.

3. Inspect the critical routes.
   - `/`: value proposition, navigation, and path into search.
   - `/search?q=Q42`: search result, graph, evidence, AI actions, exports, and URL state.
   - `/agents`: specialist agent entry points and route clarity.
   - `/docs`: current documentation, screenshots, and roadmap/deployment links.

4. Fix the highest-value polish issue.
   - Prefer issues visible to a recruiter: console errors, hydration mismatches, stale screenshots, broken nav, weak empty states, text overlap, unclear agent grounding, or docs that overclaim.
   - Keep changes focused. Avoid broad rewrites unless the visual defect is systemic.
   - Update docs only when behavior, screenshots, commands, deployment notes, or portfolio claims changed.

5. Verify with evidence.
   - Run `npm run lint` or the closest targeted test after source edits.
   - Run `npm run verify` before release-quality claims.
   - Run `npm run smoke` and `npm run e2e` when route behavior changes and a server is available.
   - Run `npm run visual:qa` for visual or screenshot-facing changes, then inspect the generated images.
   - Run `npm run trace:check` when portfolio evidence, docs, screenshots, or file coverage changed.

6. Report like a reviewer.
   - State the quality lift in product terms.
   - List the exact checks that passed or what could not be run.
   - Call out remaining portfolio risks and the next most valuable improvement.
   - If the user asks to ship, invoke the `ship` skill and follow its locked workflow.

## Rubric Reference

For a fuller scoring pass, read `references/portfolio-rubric.md`. Use it when the user asks for a grade, portfolio evaluation, or a prioritized quality plan.

## Done Criteria

The QA pass is done when the visible issue is fixed or clearly documented, the verification evidence matches the change, docs are not stale, and the final response gives the user a credible next step toward a stronger portfolio score.
