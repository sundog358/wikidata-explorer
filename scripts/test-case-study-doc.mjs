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
  "AG2_SERVICE_URL",
  "Vercel",
]) {
  assert.ok(caseStudy.includes(phrase), `case study missing ${phrase}`);
}

assert.match(readme, /\[docs\/case-study\.md\]\(docs\/case-study\.md\)/);
assert.match(docsPage, /Portfolio Case Study/);
assert.match(docsPage, /case-study\.md/);
assert.match(docsPage, /architecture, AI safety boundary, testing strategy, deployment tradeoffs/);

console.log("PASS case study doc tests");
