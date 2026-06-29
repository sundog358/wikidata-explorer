import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  portfolioEvidenceReport,
  writePortfolioEvidenceSummary,
} from "../lib/portfolio-evidence.mjs";

const SECRET_PATTERNS = Object.freeze([
  /sk-[A-Za-z0-9_-]{8,}/,
  /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/i,
  /(api[_-]?key|token|secret|authorization)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{8,}/i,
]);

function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

function optionValue(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const logDir = optionValue("dir", ".");
const resolvedLogDir = path.resolve(logDir);
const report = await portfolioEvidenceReport({
  logDir: resolvedLogDir,
  requireProduction: true,
  requireHostedOps: true,
  requireHostedAg2: true,
});
let existingSummaryJson = null;

async function readRequiredText(filePath, label) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { error: `${label} is required in the downloaded portfolio 10/10 proof bundle.` };
    }
    return { error: `${label} could not be read: ${error?.message || error}` };
  }
}

async function existingSummaryErrors() {
  const errors = [];
  const jsonPath = path.join(resolvedLogDir, "portfolio-evidence-summary.json");
  const markdownPath = path.join(resolvedLogDir, "portfolio-evidence-summary.md");
  const jsonText = await readRequiredText(jsonPath, "portfolio-evidence-summary.json");
  const markdownText = await readRequiredText(markdownPath, "portfolio-evidence-summary.md");

  let summaryJson = null;
  if (typeof jsonText === "object") {
    errors.push(jsonText.error);
  } else {
    try {
      summaryJson = JSON.parse(jsonText);
    } catch (error) {
      errors.push(`portfolio-evidence-summary.json is not valid JSON: ${error?.message || error}`);
    }
  }

  if (typeof markdownText === "object") {
    errors.push(markdownText.error);
  } else {
    if (!markdownText.includes("Release readiness: Portfolio 10/10 ready (10/10)")) {
      errors.push("portfolio-evidence-summary.md must classify the bundle as Portfolio 10/10 ready (10/10).");
    }
    if (!markdownText.includes("## Artifact Digests")) {
      errors.push("portfolio-evidence-summary.md must include an Artifact Digests section.");
    }
    if (!markdownText.includes("## Hosted Targets")) {
      errors.push("portfolio-evidence-summary.md must include a Hosted Targets section.");
    }
    for (const proof of report.proofs) {
      if (proof.artifact.sha256 && !markdownText.includes(proof.artifact.sha256)) {
        errors.push(`portfolio-evidence-summary.md is missing the current SHA-256 digest for ${proof.id}.`);
      }
      if (proof.target?.appUrl && !markdownText.includes(proof.target.appUrl)) {
        errors.push(`portfolio-evidence-summary.md is missing the current app target for ${proof.id}.`);
      }
      if (proof.target?.serviceUrl && !markdownText.includes(proof.target.serviceUrl)) {
        errors.push(`portfolio-evidence-summary.md is missing the current service target for ${proof.id}.`);
      }
    }
  }

  if (summaryJson) {
    existingSummaryJson = summaryJson;
    if (summaryJson.ok !== true) {
      errors.push("portfolio-evidence-summary.json must have ok=true.");
    }
    if (summaryJson.releaseReadiness?.id !== "portfolio-10-ready" || summaryJson.releaseReadiness?.grade !== "10/10") {
      errors.push("portfolio-evidence-summary.json must classify the bundle as portfolio-10-ready with grade 10/10.");
    }
    for (const proof of report.proofs) {
      const summarizedProof = summaryJson.proofs?.find((item) => item?.id === proof.id);
      if (!summarizedProof) {
        errors.push(`portfolio-evidence-summary.json is missing ${proof.id}.`);
        continue;
      }
      if (summarizedProof.required !== true || summarizedProof.present !== true || summarizedProof.ok !== true) {
        errors.push(`portfolio-evidence-summary.json must mark ${proof.id} as required, present, and passing.`);
      }
      if (summarizedProof.artifact?.fileName !== proof.artifact.fileName) {
        errors.push(`portfolio-evidence-summary.json has a stale file name for ${proof.id}.`);
      }
      if (summarizedProof.artifact?.bytes !== proof.artifact.bytes) {
        errors.push(`portfolio-evidence-summary.json has a stale byte count for ${proof.id}.`);
      }
      if (summarizedProof.artifact?.sha256 !== proof.artifact.sha256) {
        errors.push(`portfolio-evidence-summary.json has a stale SHA-256 digest for ${proof.id}.`);
      }
      if ((summarizedProof.target?.appUrl || "") !== (proof.target?.appUrl || "")) {
        errors.push(`portfolio-evidence-summary.json has a stale app target for ${proof.id}.`);
      }
      if ((summarizedProof.target?.serviceUrl || "") !== (proof.target?.serviceUrl || "")) {
        errors.push(`portfolio-evidence-summary.json has a stale service target for ${proof.id}.`);
      }
    }
    if (hasFlag("require-check-log")) {
      const provenance = summaryJson.provenance || {};
      const requiredProvenanceFields = ["repository", "workflow", "runId", "runUrl", "refName", "sha"];
      if (provenance.source !== "github-actions") {
        errors.push("portfolio-evidence-summary.json must include GitHub Actions provenance for downloaded 10/10 proof artifacts.");
      }
      for (const field of requiredProvenanceFields) {
        if (!provenance[field]) {
          errors.push(`portfolio-evidence-summary.json is missing GitHub Actions provenance field ${field}.`);
        }
      }
      if (provenance.repository && provenance.runId && provenance.runUrl) {
        const expectedRunPath = `${provenance.repository}/actions/runs/${provenance.runId}`;
        if (!provenance.runUrl.includes(expectedRunPath)) {
          errors.push("portfolio-evidence-summary.json runUrl must point to the recorded GitHub Actions run id.");
        }
      }
      if (typeof markdownText !== "object") {
        if (!markdownText.includes("## Provenance")) {
          errors.push("portfolio-evidence-summary.md must include a Provenance section.");
        }
        for (const value of [provenance.repository, provenance.workflow, provenance.runId, provenance.runUrl, provenance.refName, provenance.sha].filter(Boolean)) {
          if (!markdownText.includes(value)) {
            errors.push(`portfolio-evidence-summary.md is missing GitHub Actions provenance value ${value}.`);
          }
        }
      }
    }
  }

  return errors;
}

function provenanceLine(provenance = {}) {
  return [
    "EVIDENCE provenance",
    `source=${provenance.source || "unknown"}`,
    `repo=${provenance.repository || "n/a"}`,
    `workflow=${String(provenance.workflow || "n/a").replace(/\s+/g, "_")}`,
    `run=${provenance.runId || "n/a"}`,
    `ref=${provenance.refName || "n/a"}`,
    `sha=${provenance.sha || "n/a"}`,
    `url=${provenance.runUrl || "n/a"}`,
  ].join(" ");
}

async function checkLogErrors() {
  if (!hasFlag("require-check-log")) return [];

  const errors = [];
  const checkLogPath = path.join(resolvedLogDir, "portfolio-10-check.log");
  const checkLogText = await readRequiredText(checkLogPath, "portfolio-10-check.log");
  if (typeof checkLogText === "object") return [checkLogText.error];

  if (!checkLogText.includes("PASS portfolio 10/10 readiness evidence")) {
    errors.push("portfolio-10-check.log must include the final portfolio 10/10 PASS line.");
  }
  const readinessLine = `EVIDENCE release readiness ${report.releaseReadiness.label} (${report.releaseReadiness.grade})`;
  if (!checkLogText.includes(readinessLine)) {
    errors.push("portfolio-10-check.log must include the final release-readiness evidence line.");
  }
  const provenance = existingSummaryJson?.provenance || {};
  if (provenance.source === "github-actions") {
    const expectedProvenanceLine = provenanceLine(provenance);
    if (!checkLogText.includes(expectedProvenanceLine)) {
      errors.push("portfolio-10-check.log must include the GitHub Actions provenance evidence line.");
    }
  }
  for (const proof of report.proofs) {
    if (proof.target?.appUrl) {
      const targetLine = `EVIDENCE target ${proof.id} app=${proof.target.appUrl} service=${proof.target.serviceUrl || "n/a"}`;
      if (!checkLogText.includes(targetLine)) {
        errors.push(`portfolio-10-check.log must include the target evidence line for ${proof.id}.`);
      }
    }
    if (proof.artifact?.sha256) {
      const artifactLine = `EVIDENCE artifact ${proof.id} file=${proof.artifact.fileName} bytes=${proof.artifact.bytes} sha256=${proof.artifact.sha256}`;
      if (!checkLogText.includes(artifactLine)) {
        errors.push(`portfolio-10-check.log must include the artifact digest evidence line for ${proof.id}.`);
      }
    }
  }
  if (/^FAIL\b/m.test(checkLogText)) {
    errors.push("portfolio-10-check.log must not contain FAIL lines.");
  }
  const secretFindings = SECRET_PATTERNS
    .filter((pattern) => pattern.test(checkLogText))
    .map((pattern) => pattern.source);
  if (secretFindings.length) {
    errors.push("portfolio-10-check.log contains secret-shaped text.");
  }

  return errors;
}

function normalizedUrl(value = "") {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function isPlaceholderUrl(value = "") {
  const raw = String(value).toLowerCase();
  return raw.includes("replace-with") || raw.includes("example.com") || raw.includes("<");
}

async function proofTargetErrors() {
  const errors = [];
  const hostedOpsText = await readRequiredText(path.join(resolvedLogDir, "hosted-ops-proof.log"), "hosted-ops-proof.log");
  const hostedAg2Text = await readRequiredText(path.join(resolvedLogDir, "ag2-hosted-proof.log"), "ag2-hosted-proof.log");

  if (typeof hostedOpsText === "object") {
    errors.push(hostedOpsText.error);
  } else {
    const target = hostedOpsText.match(/^PASS hosted-ops-target app=(\S+)$/m)?.[1] || "";
    const final = hostedOpsText.match(/^PASS hosted ops proof \((\S+)\)$/m)?.[1] || "";
    if (!target) errors.push("hosted-ops-proof.log must include PASS hosted-ops-target app=...");
    if (!final) errors.push("hosted-ops-proof.log must include the final hosted ops proof PASS line.");
    if (target && isPlaceholderUrl(target)) errors.push("hosted-ops-proof.log must not use a placeholder hosted app target.");
    if (target && final && normalizedUrl(target) !== normalizedUrl(final)) {
      errors.push("hosted-ops-proof.log target app must match the final hosted ops proof URL.");
    }
  }

  if (typeof hostedAg2Text === "object") {
    errors.push(hostedAg2Text.error);
  } else {
    const target = hostedAg2Text.match(/^PASS hosted-ag2-targets app=(\S+) service=(\S+)$/m);
    const appTarget = target?.[1] || "";
    const serviceTarget = target?.[2] || "";
    const final = hostedAg2Text.match(/^PASS hosted AG2 proof \((\S+)\)$/m)?.[1] || "";
    if (!target) errors.push("ag2-hosted-proof.log must include PASS hosted-ag2-targets app=... service=...");
    if (!final) errors.push("ag2-hosted-proof.log must include the final hosted AG2 proof PASS line.");
    if (appTarget && isPlaceholderUrl(appTarget)) errors.push("ag2-hosted-proof.log must not use a placeholder AI app target.");
    if (serviceTarget && isPlaceholderUrl(serviceTarget)) errors.push("ag2-hosted-proof.log must not use a placeholder AG2 service target.");
    if (appTarget && final && normalizedUrl(appTarget) !== normalizedUrl(final)) {
      errors.push("ag2-hosted-proof.log target app must match the final hosted AG2 proof URL.");
    }
  }

  return errors;
}

const summaryErrors = await existingSummaryErrors();
const gateLogErrors = await checkLogErrors();
const targetErrors = await proofTargetErrors();

for (const proof of report.proofs) {
  console.log(`${proof.ok ? "PASS" : "FAIL"} ${proof.id}: required=${proof.required} present=${proof.present}`);
}

if (!report.ok || summaryErrors.length || gateLogErrors.length || targetErrors.length) {
  console.error("FAIL portfolio 10/10 readiness requires production, hosted ops, and hosted AG2 proof logs.");
  for (const error of report.errors) console.error(`FAIL ${error}`);
  for (const error of summaryErrors) console.error(`FAIL ${error}`);
  for (const error of gateLogErrors) console.error(`FAIL ${error}`);
  for (const error of targetErrors) console.error(`FAIL ${error}`);
  process.exit(1);
}

const defaultOutputDir = hasFlag("require-check-log")
  ? path.join(resolvedLogDir, "portfolio-10-local-check")
  : resolvedLogDir;
const summary = await writePortfolioEvidenceSummary(report, {
  outputDir: optionValue("out-dir", defaultOutputDir),
});
const outputProvenance = existingSummaryJson?.provenance || report.provenance;

console.log(`EVIDENCE summary JSON ${summary.jsonPath}`);
console.log(`EVIDENCE summary Markdown ${summary.markdownPath}`);
console.log(`EVIDENCE release readiness ${report.releaseReadiness.label} (${report.releaseReadiness.grade})`);
console.log(provenanceLine(outputProvenance));
for (const proof of report.proofs) {
  if (proof.target?.appUrl) {
    console.log(`EVIDENCE target ${proof.id} app=${proof.target.appUrl} service=${proof.target.serviceUrl || "n/a"}`);
  }
}
for (const proof of report.proofs) {
  if (proof.artifact?.sha256) {
    console.log(`EVIDENCE artifact ${proof.id} file=${proof.artifact.fileName} bytes=${proof.artifact.bytes} sha256=${proof.artifact.sha256}`);
  }
}
console.log("PASS portfolio 10/10 readiness evidence");
