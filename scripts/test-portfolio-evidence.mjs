import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  portfolioEvidenceMarkdown,
  portfolioEvidenceReport,
  writePortfolioEvidenceSummary,
} from "../lib/portfolio-evidence.mjs";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-evidence-"));

await writeFile(path.join(tempDir, "production-proof.log"), [
  "Production proof target: https://www.wikidataexplorer.com",
  "PASS production proof checks",
  "EVIDENCE GitHub Actions CI is green for the deployed commit.",
  "EVIDENCE Vercel deployment status is successful for the deployed commit.",
  "EVIDENCE The production proof command passes against the public URL.",
].join("\n"), "utf8");

await writeFile(path.join(tempDir, "hosted-ops-proof.log"), [
  "PASS hosted-ops-target app=https://www.wikidataexplorer.com",
  "PASS workspace-store account=ops-proof-account project=ops-proof-project isolated=true tasks=1 agentRuns=1",
  "PASS observability-receiver durable=true retainedEvents=1",
  "PASS hosted ops proof (https://www.wikidataexplorer.com)",
].join("\n"), "utf8");

await writeFile(path.join(tempDir, "ag2-hosted-proof.log"), [
  "PASS hosted-ag2-targets app=https://www.wikidataexplorer.com service=https://ag2.wikidataexplorer.com",
  "PASS ag2-demo-readiness checks=7",
  "PASS grounded-entity-summary route=/api/entity-summary matched=Q42,P31",
  "PASS observability-delivery durable=true retainedEvents=2",
  "PASS hosted AG2 proof (https://www.wikidataexplorer.com)",
].join("\n"), "utf8");

const report = await portfolioEvidenceReport({
  logDir: tempDir,
  requireHostedOps: true,
  requireHostedAg2: true,
  generatedAt: "2026-06-29T12:00:00.000Z",
  env: {
    GITHUB_REPOSITORY: "sundog358/wikidata-explorer",
    GITHUB_WORKFLOW: "Production Proof",
    GITHUB_RUN_ID: "123456789",
    GITHUB_RUN_ATTEMPT: "2",
    GITHUB_REF_NAME: "main",
    GITHUB_SHA: "abc123def456",
    GITHUB_SERVER_URL: "https://github.com",
  },
});
assert.equal(report.ok, true);
assert.equal(report.releaseReadiness.id, "portfolio-10-ready");
assert.equal(report.releaseReadiness.grade, "10/10");
assert.equal(report.provenance.source, "github-actions");
assert.equal(report.provenance.runUrl, "https://github.com/sundog358/wikidata-explorer/actions/runs/123456789");
assert.deepEqual(report.proofs.map((proof) => proof.id), ["production-proof", "hosted-ops-proof", "hosted-ag2-proof"]);
assert.equal(report.proofs.every((proof) => proof.ok && proof.present), true);
assert.deepEqual(report.proofs.find((proof) => proof.id === "production-proof").target, {
  appUrl: "https://www.wikidataexplorer.com",
  serviceUrl: "",
});
assert.deepEqual(report.proofs.find((proof) => proof.id === "hosted-ops-proof").target, {
  appUrl: "https://www.wikidataexplorer.com",
  serviceUrl: "",
});
assert.deepEqual(report.proofs.find((proof) => proof.id === "hosted-ag2-proof").target, {
  appUrl: "https://www.wikidataexplorer.com",
  serviceUrl: "https://ag2.wikidataexplorer.com",
});
for (const proof of report.proofs) {
  assert.equal(proof.artifact.fileName.endsWith(".log"), true);
  assert.ok(proof.artifact.bytes > 0, `${proof.id} should include artifact byte count`);
  assert.match(proof.artifact.sha256, /^[a-f0-9]{64}$/);
}

const summary = await writePortfolioEvidenceSummary(report, { outputDir: tempDir });
const summaryJson = JSON.parse(await readFile(summary.jsonPath, "utf8"));
const summaryMarkdown = await readFile(summary.markdownPath, "utf8");
assert.equal(summaryJson.ok, true);
assert.match(summaryMarkdown, /# Wikidata Explorer Portfolio Evidence/);
assert.match(summaryMarkdown, /Release readiness: Portfolio 10\/10 ready \(10\/10\)/);
assert.match(summaryMarkdown, /## Provenance/);
assert.match(summaryMarkdown, /Run URL: https:\/\/github\.com\/sundog358\/wikidata-explorer\/actions\/runs\/123456789/);
assert.match(summaryMarkdown, /SHA: abc123def456/);
assert.match(summaryMarkdown, /## Hosted Targets/);
assert.match(summaryMarkdown, /\| production-proof \| https:\/\/www\.wikidataexplorer\.com \| n\/a \|/);
assert.match(summaryMarkdown, /\| hosted-ops-proof \| https:\/\/www\.wikidataexplorer\.com \| n\/a \|/);
assert.match(summaryMarkdown, /\| hosted-ag2-proof \| https:\/\/www\.wikidataexplorer\.com \| https:\/\/ag2\.wikidataexplorer\.com \|/);
assert.match(summaryMarkdown, /## Artifact Digests/);
assert.match(summaryMarkdown, /SHA-256/);
assert.match(summaryMarkdown, /\| hosted-ag2-proof \| ag2-hosted-proof\.log \| \d+ \| [a-f0-9]{64} \|/);
assert.match(summaryMarkdown, /hosted-ag2-proof/);
assert.equal(portfolioEvidenceMarkdown(report), summaryMarkdown);

const missingOptional = await portfolioEvidenceReport({
  logDir: await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-evidence-public-only-")),
  requireHostedOps: false,
  requireHostedAg2: false,
});
assert.equal(missingOptional.ok, false, "production proof remains required by default");
assert.ok(missingOptional.errors.some((error) => error.includes("production-proof")));

const publicOnlyDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-evidence-public-"));
await writeFile(path.join(publicOnlyDir, "production-proof.log"), await readFile(path.join(tempDir, "production-proof.log"), "utf8"), "utf8");
const publicOnly = await portfolioEvidenceReport({ logDir: publicOnlyDir });
assert.equal(publicOnly.ok, true);
assert.equal(publicOnly.releaseReadiness.id, "partial-proof-ready");
assert.equal(publicOnly.releaseReadiness.grade, "9.8/10");
assert.equal(publicOnly.provenance.source, "local");
assert.equal(publicOnly.proofs.find((proof) => proof.id === "hosted-ops-proof").present, false);
assert.equal(publicOnly.proofs.find((proof) => proof.id === "hosted-ag2-proof").present, false);
assert.equal(publicOnly.proofs.find((proof) => proof.id === "hosted-ops-proof").artifact.bytes, 0);
assert.equal(publicOnly.proofs.find((proof) => proof.id === "hosted-ag2-proof").artifact.sha256, "");
assert.deepEqual(publicOnly.proofs.find((proof) => proof.id === "production-proof").target, { appUrl: "https://www.wikidataexplorer.com", serviceUrl: "" });
assert.deepEqual(publicOnly.proofs.find((proof) => proof.id === "hosted-ops-proof").target, { appUrl: "", serviceUrl: "" });
assert.deepEqual(publicOnly.proofs.find((proof) => proof.id === "hosted-ag2-proof").target, { appUrl: "", serviceUrl: "" });

await writeFile(path.join(tempDir, "ag2-hosted-proof.log"), [
  "PASS hosted-ag2-targets app=https://www.wikidataexplorer.com service=https://ag2.wikidataexplorer.com",
  "PASS ag2-demo-readiness checks=7",
  "PASS grounded-entity-summary route=/api/entity-summary matched=Q42,P31",
  "PASS observability-delivery durable=true retainedEvents=2",
  "PASS hosted AG2 proof (https://www.wikidataexplorer.com)",
  "token=secret-proof-token-value",
].join("\n"), "utf8");
const leaked = await portfolioEvidenceReport({
  logDir: tempDir,
  requireHostedOps: true,
  requireHostedAg2: true,
});
assert.equal(leaked.ok, false);
assert.equal(leaked.releaseReadiness.id, "not-ready");
assert.ok(leaked.errors.some((error) => error.includes("Secret-shaped text")));

console.log("PASS portfolio evidence tests");
