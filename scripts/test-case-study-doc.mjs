import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const caseStudy = readFileSync(new URL("../docs/case-study.md", import.meta.url), "utf8");
const docsPage = readFileSync(new URL("../app/docs/page.tsx", import.meta.url), "utf8");
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

for (const heading of [
  "# Wikidata Explorer Case Study",
  "## Product Problem",
  "## Architecture",
  "## AI Safety Boundary",
  "## Research Workflow",
  "## Testing Strategy",
  "## Deployment Tradeoffs",
  "## Current State",
]) {
  assert.ok(caseStudy.includes(heading), `case study missing ${heading}`);
}

for (const phrase of [
  "www.wikidataexplorer.com",
  "Q42",
  "P31",
  "Q46248",
  "Grounding references",
  "npm run verify",
  "npm run e2e",
  "npm run ag2:demo:check -- --health",
  "npm run ag2:hosted:proof",
  "app/service target pair",
  "npm run portfolio:evidence",
  "npm run portfolio:hosted:preflight",
  "npm run portfolio:10:check",
  "npm run production:proof",
  "npm run ops:proof",
  "hosted app target URL",
  "Production Proof",
  "AG2 Demo Proof",
  "hosted ops proof",
  "ag2-hosted-proof-log",
  "portfolio-evidence-summary",
  "release-readiness classification",
  "GitHub Actions provenance",
  "container healthcheck",
  ".dockerignore",
  "GitHub Actions run URL",
  "commit SHA",
  "workspace/observability",
  "account/project namespace isolation",
  "one self-validating release artifact",
  "GitHub Actions secret metadata",
  "AG2_SERVICE_URL",
  "durable filesystem-backed store",
  "account-scoped project workspace store",
  "identity-backed curation tasks",
  "Vercel",
]) {
  assert.ok(caseStudy.includes(phrase), `case study missing ${phrase}`);
}

assert.match(readme, /\[docs\/case-study\.md\]\(docs\/case-study\.md\)/);
assert.match(docsPage, /Portfolio Case Study/);
assert.match(docsPage, /case-study\.md/);
assert.match(docsPage, /architecture, AI safety boundary, testing strategy, deployment tradeoffs/);

console.log("PASS case study doc tests");
