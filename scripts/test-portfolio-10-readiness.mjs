import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import {
  portfolioEvidenceReport,
  writePortfolioEvidenceSummary,
} from "../lib/portfolio-evidence.mjs";

const GITHUB_PROVENANCE_ENV = Object.freeze({
  GITHUB_REPOSITORY: "sundog358/wikidata-explorer",
  GITHUB_WORKFLOW: "Production Proof",
  GITHUB_RUN_ID: "123456789",
  GITHUB_RUN_ATTEMPT: "1",
  GITHUB_REF_NAME: "main",
  GITHUB_SHA: "abc123def4567890abc123def4567890abc123de",
  GITHUB_SERVER_URL: "https://github.com",
});

function runReadiness(args = []) {
  return spawnSync(process.execPath, ["scripts/check-portfolio-10-readiness.mjs", ...args], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });
}

async function writeCompleteEvidence(dir) {
  await writeFile(path.join(dir, "production-proof.log"), [
    "Production proof target: https://www.wikidataexplorer.com",
    "PASS production proof checks",
    "EVIDENCE GitHub Actions CI is green for the deployed commit.",
    "EVIDENCE Vercel deployment status is successful for the deployed commit.",
    "EVIDENCE The production proof command passes against the public URL.",
  ].join("\n"), "utf8");

  await writeFile(path.join(dir, "hosted-ops-proof.log"), [
    "PASS hosted-ops-target app=https://www.wikidataexplorer.com",
    "PASS workspace-store account=ops-proof-account project=ops-proof-project isolated=true tasks=1 agentRuns=1",
    "PASS observability-receiver durable=true retainedEvents=1",
    "PASS hosted ops proof (https://www.wikidataexplorer.com)",
  ].join("\n"), "utf8");

  await writeFile(path.join(dir, "ag2-hosted-proof.log"), [
    "PASS hosted-ag2-targets app=https://www.wikidataexplorer.com service=https://ag2.wikidataexplorer.com",
    "PASS ag2-demo-readiness checks=7",
    "PASS grounded-entity-summary route=/api/entity-summary matched=Q42,P31",
    "PASS observability-delivery durable=true retainedEvents=2",
    "PASS hosted AG2 proof (https://www.wikidataexplorer.com)",
  ].join("\n"), "utf8");
}

function provenanceLine(provenance) {
  return [
    "EVIDENCE provenance",
    `source=${provenance.source}`,
    `repo=${provenance.repository}`,
    `workflow=${provenance.workflow.replace(/\s+/g, "_")}`,
    `run=${provenance.runId}`,
    `ref=${provenance.refName}`,
    `sha=${provenance.sha}`,
    `url=${provenance.runUrl}`,
  ].join(" ");
}

async function writeCompleteSummary(dir, env = undefined) {
  const report = await portfolioEvidenceReport({
    logDir: dir,
    requireProduction: true,
    requireHostedOps: true,
    requireHostedAg2: true,
    ...(env ? { env } : {}),
  });
  await writePortfolioEvidenceSummary(report, { outputDir: dir });
}

async function writeCleanCheckLog(dir, env = undefined) {
  const report = await portfolioEvidenceReport({
    logDir: dir,
    requireProduction: true,
    requireHostedOps: true,
    requireHostedAg2: true,
    ...(env ? { env } : {}),
  });
  const targetLines = report.proofs
    .filter((proof) => proof.target?.appUrl)
    .map((proof) => `EVIDENCE target ${proof.id} app=${proof.target.appUrl} service=${proof.target.serviceUrl || "n/a"}`);
  const artifactLines = report.proofs
    .filter((proof) => proof.artifact?.sha256)
    .map((proof) => `EVIDENCE artifact ${proof.id} file=${proof.artifact.fileName} bytes=${proof.artifact.bytes} sha256=${proof.artifact.sha256}`);

  await writeFile(path.join(dir, "portfolio-10-check.log"), [
    "PASS production-proof: required=true present=true",
    "PASS hosted-ops-proof: required=true present=true",
    "PASS hosted-ag2-proof: required=true present=true",
    "EVIDENCE summary JSON /tmp/portfolio-evidence-summary.json",
    "EVIDENCE summary Markdown /tmp/portfolio-evidence-summary.md",
    `EVIDENCE release readiness ${report.releaseReadiness.label} (${report.releaseReadiness.grade})`,
    provenanceLine(report.provenance),
    ...targetLines,
    ...artifactLines,
    "PASS portfolio 10/10 readiness evidence",
  ].join("\n"), "utf8");
}

const completeDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-ready-"));
await writeCompleteEvidence(completeDir);
await writeCompleteSummary(completeDir);
const passed = runReadiness([`--dir=${completeDir}`]);
assert.equal(passed.status, 0, passed.stderr || passed.stdout);
assert.match(passed.stdout, /PASS portfolio 10\/10 readiness evidence/);
assert.match(passed.stdout, /portfolio-evidence-summary\.md/);
const summary = JSON.parse(await readFile(path.join(completeDir, "portfolio-evidence-summary.json"), "utf8"));
assert.equal(summary.ok, true);
assert.equal(summary.releaseReadiness.id, "portfolio-10-ready");
assert.equal(summary.releaseReadiness.grade, "10/10");
assert.equal(summary.provenance.source, "local");
assert.equal(summary.proofs.every((proof) => proof.required && proof.present && proof.ok), true);
assert.equal(summary.proofs.every((proof) => proof.artifact.bytes > 0 && /^[a-f0-9]{64}$/.test(proof.artifact.sha256)), true);
assert.equal(summary.proofs.find((proof) => proof.id === "hosted-ops-proof").target.appUrl, "https://www.wikidataexplorer.com");
assert.equal(summary.proofs.find((proof) => proof.id === "hosted-ag2-proof").target.serviceUrl, "https://ag2.wikidataexplorer.com");
assert.equal(summary.proofs.find((proof) => proof.id === "production-proof").target.appUrl, "https://www.wikidataexplorer.com");

const completeArtifactDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-artifact-"));
await writeCompleteEvidence(completeArtifactDir);
await writeCompleteSummary(completeArtifactDir, GITHUB_PROVENANCE_ENV);
const archivedSummaryBefore = await readFile(path.join(completeArtifactDir, "portfolio-evidence-summary.json"), "utf8");
await writeCleanCheckLog(completeArtifactDir, GITHUB_PROVENANCE_ENV);
const artifactPassed = runReadiness([`--dir=${completeArtifactDir}`, "--require-check-log"]);
assert.equal(artifactPassed.status, 0, artifactPassed.stderr || artifactPassed.stdout);
assert.match(artifactPassed.stdout, /PASS portfolio 10\/10 readiness evidence/);
assert.match(artifactPassed.stdout, /EVIDENCE release readiness Portfolio 10\/10 ready \(10\/10\)/);
assert.match(artifactPassed.stdout, /EVIDENCE provenance source=github-actions repo=sundog358\/wikidata-explorer workflow=Production_Proof run=123456789 ref=main sha=abc123def4567890abc123def4567890abc123de url=https:\/\/github\.com\/sundog358\/wikidata-explorer\/actions\/runs\/123456789/);
assert.match(artifactPassed.stdout, /EVIDENCE target hosted-ag2-proof app=https:\/\/www\.wikidataexplorer\.com service=https:\/\/ag2\.wikidataexplorer\.com/);
assert.match(artifactPassed.stdout, /EVIDENCE artifact hosted-ag2-proof file=ag2-hosted-proof\.log bytes=\d+ sha256=[a-f0-9]{64}/);
assert.equal(await readFile(path.join(completeArtifactDir, "portfolio-evidence-summary.json"), "utf8"), archivedSummaryBefore);
assert.match(await readFile(path.join(completeArtifactDir, "portfolio-10-local-check", "portfolio-evidence-summary.json"), "utf8"), /"source": "local"/);

const missingCheckLogDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-no-check-log-"));
await writeCompleteEvidence(missingCheckLogDir);
await writeCompleteSummary(missingCheckLogDir, GITHUB_PROVENANCE_ENV);
const missingCheckLog = runReadiness([`--dir=${missingCheckLogDir}`, "--require-check-log"]);
assert.notEqual(missingCheckLog.status, 0);
assert.match(missingCheckLog.stderr, /portfolio-10-check\.log is required/);

const badCheckLogDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-bad-check-log-"));
await writeCompleteEvidence(badCheckLogDir);
await writeCompleteSummary(badCheckLogDir, GITHUB_PROVENANCE_ENV);
await writeFile(path.join(badCheckLogDir, "portfolio-10-check.log"), [
  "FAIL hosted-ag2-proof: required=true present=false",
  "token=secret-proof-token-value",
].join("\n"), "utf8");
const badCheckLog = runReadiness([`--dir=${badCheckLogDir}`, "--require-check-log"]);
assert.notEqual(badCheckLog.status, 0);
assert.match(badCheckLog.stderr, /portfolio-10-check\.log must include the final portfolio 10\/10 PASS line/);
assert.match(badCheckLog.stderr, /portfolio-10-check\.log must include the final release-readiness evidence line/);
assert.match(badCheckLog.stderr, /portfolio-10-check\.log must include the GitHub Actions provenance evidence line/);
assert.match(badCheckLog.stderr, /portfolio-10-check\.log must include the target evidence line for hosted-ag2-proof/);
assert.match(badCheckLog.stderr, /portfolio-10-check\.log must include the artifact digest evidence line for hosted-ag2-proof/);
assert.match(badCheckLog.stderr, /portfolio-10-check\.log must not contain FAIL lines/);
assert.match(badCheckLog.stderr, /portfolio-10-check\.log contains secret-shaped text/);

const mismatchedOpsTargetDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-bad-ops-target-"));
await writeFile(path.join(mismatchedOpsTargetDir, "hosted-ops-proof.log"), [
  "PASS hosted-ops-target app=https://stale.wikidataexplorer.com",
  "PASS workspace-store account=ops-proof-account project=ops-proof-project isolated=true tasks=1 agentRuns=1",
  "PASS observability-receiver durable=true retainedEvents=1",
  "PASS hosted ops proof (https://www.wikidataexplorer.com)",
].join("\n"), "utf8");
await writeFile(path.join(mismatchedOpsTargetDir, "production-proof.log"), await readFile(path.join(completeDir, "production-proof.log"), "utf8"), "utf8");
await writeFile(path.join(mismatchedOpsTargetDir, "ag2-hosted-proof.log"), await readFile(path.join(completeDir, "ag2-hosted-proof.log"), "utf8"), "utf8");
await writeCompleteSummary(mismatchedOpsTargetDir);
const badOpsTarget = runReadiness([`--dir=${mismatchedOpsTargetDir}`]);
assert.notEqual(badOpsTarget.status, 0);
assert.match(badOpsTarget.stderr, /hosted-ops-proof\.log target app must match/);

const mismatchedAg2TargetDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-bad-ag2-target-"));
await writeFile(path.join(mismatchedAg2TargetDir, "production-proof.log"), await readFile(path.join(completeDir, "production-proof.log"), "utf8"), "utf8");
await writeFile(path.join(mismatchedAg2TargetDir, "hosted-ops-proof.log"), await readFile(path.join(completeDir, "hosted-ops-proof.log"), "utf8"), "utf8");
await writeFile(path.join(mismatchedAg2TargetDir, "ag2-hosted-proof.log"), [
  "PASS hosted-ag2-targets app=https://www.wikidataexplorer.com service=https://replace-with-hosted-ag2.example.com",
  "PASS ag2-demo-readiness checks=7",
  "PASS grounded-entity-summary route=/api/entity-summary matched=Q42,P31",
  "PASS observability-delivery durable=true retainedEvents=2",
  "PASS hosted AG2 proof (https://www.wikidataexplorer.com)",
].join("\n"), "utf8");
await writeCompleteSummary(mismatchedAg2TargetDir);
const badAg2Target = runReadiness([`--dir=${mismatchedAg2TargetDir}`]);
assert.notEqual(badAg2Target.status, 0);
assert.match(badAg2Target.stderr, /ag2-hosted-proof\.log must not use a placeholder AG2 service target/);

const missingSummaryDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-no-summary-"));
await writeCompleteEvidence(missingSummaryDir);
const missingSummary = runReadiness([`--dir=${missingSummaryDir}`]);
assert.notEqual(missingSummary.status, 0);
assert.match(missingSummary.stderr, /portfolio-evidence-summary\.json is required/);
assert.match(missingSummary.stderr, /portfolio-evidence-summary\.md is required/);

const localArtifactSummaryDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-local-provenance-"));
await writeCompleteEvidence(localArtifactSummaryDir);
await writeCompleteSummary(localArtifactSummaryDir);
await writeCleanCheckLog(localArtifactSummaryDir);
const localArtifactSummary = runReadiness([`--dir=${localArtifactSummaryDir}`, "--require-check-log"]);
assert.notEqual(localArtifactSummary.status, 0);
assert.match(localArtifactSummary.stderr, /portfolio-evidence-summary\.json must include GitHub Actions provenance/);

const staleProvenanceDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-stale-provenance-"));
await writeCompleteEvidence(staleProvenanceDir);
await writeCompleteSummary(staleProvenanceDir, GITHUB_PROVENANCE_ENV);
await writeCleanCheckLog(staleProvenanceDir, GITHUB_PROVENANCE_ENV);
const staleProvenancePath = path.join(staleProvenanceDir, "portfolio-evidence-summary.json");
const staleProvenance = JSON.parse(await readFile(staleProvenancePath, "utf8"));
staleProvenance.provenance.runUrl = "https://github.com/sundog358/wikidata-explorer/actions/runs/999";
await writeFile(staleProvenancePath, JSON.stringify(staleProvenance, null, 2), "utf8");
const badProvenance = runReadiness([`--dir=${staleProvenanceDir}`, "--require-check-log"]);
assert.notEqual(badProvenance.status, 0);
assert.match(badProvenance.stderr, /runUrl must point to the recorded GitHub Actions run id/);

const staleSummaryDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-stale-summary-"));
await writeCompleteEvidence(staleSummaryDir);
await writeCompleteSummary(staleSummaryDir);
const staleSummaryPath = path.join(staleSummaryDir, "portfolio-evidence-summary.json");
const staleSummary = JSON.parse(await readFile(staleSummaryPath, "utf8"));
staleSummary.proofs.find((proof) => proof.id === "hosted-ag2-proof").artifact.sha256 = "0".repeat(64);
await writeFile(staleSummaryPath, JSON.stringify(staleSummary, null, 2), "utf8");
const stale = runReadiness([`--dir=${staleSummaryDir}`]);
assert.notEqual(stale.status, 0);
assert.match(stale.stderr, /stale SHA-256 digest for hosted-ag2-proof/);

const staleTargetSummaryDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-stale-target-"));
await writeCompleteEvidence(staleTargetSummaryDir);
await writeCompleteSummary(staleTargetSummaryDir);
const staleTargetSummaryPath = path.join(staleTargetSummaryDir, "portfolio-evidence-summary.json");
const staleTargetSummary = JSON.parse(await readFile(staleTargetSummaryPath, "utf8"));
staleTargetSummary.proofs.find((proof) => proof.id === "hosted-ag2-proof").target.serviceUrl = "https://stale-ag2.wikidataexplorer.com";
await writeFile(staleTargetSummaryPath, JSON.stringify(staleTargetSummary, null, 2), "utf8");
const staleTarget = runReadiness([`--dir=${staleTargetSummaryDir}`]);
assert.notEqual(staleTarget.status, 0);
assert.match(staleTarget.stderr, /stale service target for hosted-ag2-proof/);

const missingTargetMarkdownDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-no-target-markdown-"));
await writeCompleteEvidence(missingTargetMarkdownDir);
await writeCompleteSummary(missingTargetMarkdownDir);
const targetMarkdownPath = path.join(missingTargetMarkdownDir, "portfolio-evidence-summary.md");
const targetMarkdown = await readFile(targetMarkdownPath, "utf8");
await writeFile(targetMarkdownPath, targetMarkdown.replace("## Hosted Targets", "## Hosted Target Summary"), "utf8");
const missingTargetMarkdown = runReadiness([`--dir=${missingTargetMarkdownDir}`]);
assert.notEqual(missingTargetMarkdown.status, 0);
assert.match(missingTargetMarkdown.stderr, /portfolio-evidence-summary\.md must include a Hosted Targets section/);

const incompleteDir = await mkdtemp(path.join(os.tmpdir(), "wikidata-portfolio-10-missing-"));
await writeFile(path.join(incompleteDir, "production-proof.log"), await readFile(path.join(completeDir, "production-proof.log"), "utf8"), "utf8");
const failed = runReadiness([`--dir=${incompleteDir}`]);
assert.notEqual(failed.status, 0);
assert.match(failed.stderr, /requires production, hosted ops, and hosted AG2 proof logs/);
assert.match(failed.stderr, /hosted-ops-proof/);
assert.match(failed.stderr, /hosted-ag2-proof/);

console.log("PASS portfolio 10 readiness tests");
