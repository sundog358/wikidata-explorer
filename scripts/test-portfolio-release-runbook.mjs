import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const runbook = readFileSync(new URL("../docs/portfolio-10-release-runbook.md", import.meta.url), "utf8");
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const roadmap = readFileSync(new URL("../ROADMAP.md", import.meta.url), "utf8");

for (const phrase of [
  "# Portfolio 10/10 Release Runbook",
  "Last reviewed: June 29, 2026",
  "PRODUCTION_WORKSPACE_STORE_TOKEN",
  "PRODUCTION_OBSERVABILITY_RECEIVER_TOKEN",
  "AG2_DEMO_SERVICE_TOKEN",
  "AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN",
  "container healthcheck passing",
  "npm run portfolio:hosted:preflight",
  "NEXT hosted proof setup actions",
  "manual workflows run the same scoped preflights",
  "gh workflow run production-proof.yml",
  "run_ops_proof=true",
  "run_ag2_proof=true",
  "ai_app_base_url",
  "public AI-off portfolio URL",
  "the workflow runs `npm run portfolio:10:check -- --dir=.`",
  "pipefail-protected",
  "portfolio-10-check.log",
  "gh run download",
  "npm run portfolio:10:check -- --dir=.tmp\\portfolio-10-proof --require-check-log",
  "already present in the downloaded artifact",
  "production-proof.log",
  "hosted-ops-proof.log",
  "ag2-hosted-proof.log",
  "portfolio-10-check.log",
  "portfolio-evidence-summary.md",
  "portfolio-evidence-summary.json",
  "Portfolio 10/10 ready",
  "Hosted Targets",
  "public app URL",
  "JSON target fields",
  "Artifact Digests",
  "SHA-256",
  "missing or stale summaries is not accepted",
  "rejects placeholder targets",
  "target evidence lines",
  "artifact digest lines",
  "GitHub Actions provenance line",
  "run URL must point to the recorded run id",
  "portfolio-10-local-check",
  "does not contain failure lines or secret-shaped text",
  "Provenance",
  "Run URL",
  "Production proof target: ...",
  "PASS hosted-ops-target app=...",
  "PASS workspace-store account=",
  "PASS hosted-ag2-targets app=... service=...",
  "PASS observability-delivery durable=true",
  "Docker health status",
]) {
  assert.ok(runbook.includes(phrase), `portfolio release runbook missing ${phrase}`);
}

for (const forbidden of [
  "sk-proj-",
  "Bearer ",
  "gho_",
]) {
  assert.ok(!runbook.includes(forbidden), `portfolio release runbook should not contain ${forbidden}`);
}

assert.match(readme, /\[docs\/portfolio-10-release-runbook\.md\]\(docs\/portfolio-10-release-runbook\.md\)/);
assert.match(readme, /portfolio-10-check\.log/);
assert.match(readme, /GitHub Actions provenance/);
assert.match(readme, /npm run portfolio:10:check -- --dir=<artifact-dir> --require-check-log/);
assert.match(roadmap, /portfolio-10-release-runbook\.md/);
assert.match(roadmap, /npm run portfolio:10:check -- --dir=<artifact-dir> --require-check-log/);

console.log("PASS portfolio release runbook tests");
