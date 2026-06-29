import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const DEFAULT_LOGS = Object.freeze({
  production: "production-proof.log",
  hostedOps: "hosted-ops-proof.log",
  hostedAg2: "ag2-hosted-proof.log",
});

const SECRET_PATTERNS = Object.freeze([
  /sk-[A-Za-z0-9_-]{8,}/,
  /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/i,
  /(api[_-]?key|token|secret|authorization)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{8,}/i,
]);

function cleanOneLine(value = "", maxLength = 500) {
  return String(value ?? "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeDir(value = ".") {
  return path.resolve(cleanOneLine(value || "."));
}

function proofCheck(id, ok, message, details = {}) {
  return {
    id,
    ok: Boolean(ok),
    message: cleanOneLine(message),
    ...details,
  };
}

function includesAll(text, patterns = []) {
  return patterns.every((pattern) => pattern.test(text));
}

function secretFindings(text) {
  return SECRET_PATTERNS
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.source);
}

function artifactMetadata(fileName, text = "") {
  return {
    fileName,
    bytes: Buffer.byteLength(text, "utf8"),
    sha256: createHash("sha256").update(text, "utf8").digest("hex"),
  };
}

function targetMetadata(specId, text = "") {
  if (specId === "production-proof") {
    const match = text.match(/^Production proof target:\s*(\S+)$/m);
    return { appUrl: cleanOneLine(match?.[1] || ""), serviceUrl: "" };
  }
  if (specId === "hosted-ops-proof") {
    const match = text.match(/^PASS hosted-ops-target app=(\S+)$/m);
    return { appUrl: cleanOneLine(match?.[1] || ""), serviceUrl: "" };
  }
  if (specId === "hosted-ag2-proof") {
    const match = text.match(/^PASS hosted-ag2-targets app=(\S+) service=(\S+)$/m);
    return {
      appUrl: cleanOneLine(match?.[1] || ""),
      serviceUrl: cleanOneLine(match?.[2] || ""),
    };
  }
  return { appUrl: "", serviceUrl: "" };
}

async function readLog(logDir, fileName) {
  const filePath = path.resolve(logDir, fileName);
  const relative = path.relative(logDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return { exists: false, text: "", error: "invalid-log-path", fileName };
  }

  try {
    return { exists: true, text: await readFile(filePath, "utf8"), fileName };
  } catch (error) {
    if (error?.code === "ENOENT") return { exists: false, text: "", fileName };
    return { exists: false, text: "", error: cleanOneLine(error?.message || error), fileName };
  }
}

function validateLog(log, spec, required) {
  if (!log.exists) {
    return {
      id: spec.id,
      fileName: log.fileName,
      artifact: {
        fileName: log.fileName,
        bytes: 0,
        sha256: "",
      },
      target: { appUrl: "", serviceUrl: "" },
      required,
      present: false,
      ok: !required,
      checks: [proofCheck(`${spec.id}-present`, !required, required ? `${log.fileName} is required.` : `${log.fileName} was not present and is optional.`)],
    };
  }

  const findings = secretFindings(log.text);
  const checks = [
    proofCheck(`${spec.id}-present`, true, `${log.fileName} is present.`),
    proofCheck(`${spec.id}-secrets`, findings.length === 0, findings.length === 0 ? "No secret-shaped text found." : "Secret-shaped text found.", { findings }),
    ...spec.requiredPatterns.map((item) => proofCheck(
      item.id,
      includesAll(log.text, item.patterns),
      item.message,
    )),
  ];

  return {
    id: spec.id,
    fileName: log.fileName,
    artifact: artifactMetadata(log.fileName, log.text),
    target: targetMetadata(spec.id, log.text),
    required,
    present: true,
    ok: checks.every((check) => check.ok),
    checks,
  };
}

function releaseReadiness(required, ok) {
  const allProofsRequired = required.production && required.hostedOps && required.hostedAg2;
  if (ok && allProofsRequired) {
    return {
      id: "portfolio-10-ready",
      grade: "10/10",
      label: "Portfolio 10/10 ready",
      message: "Production, hosted ops, and hosted AG2 proof logs are all present and passing.",
    };
  }

  if (ok) {
    return {
      id: "partial-proof-ready",
      grade: "9.8/10",
      label: "Partial portfolio proof ready",
      message: "The required proof logs for this run passed, but this is not the final 10/10 bundle.",
    };
  }

  return {
    id: "not-ready",
    grade: "incomplete",
    label: "Portfolio proof incomplete",
    message: "One or more required proof logs are missing, failing, or contain secret-shaped text.",
  };
}

function provenanceFromEnv(env = {}) {
  const repository = cleanOneLine(env.GITHUB_REPOSITORY, 160);
  const serverUrl = cleanOneLine(env.GITHUB_SERVER_URL || "https://github.com", 120);
  const runId = cleanOneLine(env.GITHUB_RUN_ID, 80);
  const runAttempt = cleanOneLine(env.GITHUB_RUN_ATTEMPT, 20);
  const runUrl = repository && runId ? `${serverUrl}/${repository}/actions/runs/${runId}` : "";

  return {
    source: runId ? "github-actions" : "local",
    repository,
    workflow: cleanOneLine(env.GITHUB_WORKFLOW, 120),
    runId,
    runAttempt,
    runUrl,
    refName: cleanOneLine(env.GITHUB_REF_NAME, 120),
    sha: cleanOneLine(env.GITHUB_SHA, 80),
  };
}

const PROOF_SPECS = Object.freeze([
  Object.freeze({
    id: "production-proof",
    optionName: "production",
    requiredPatterns: Object.freeze([
      Object.freeze({
        id: "production-proof-pass",
        message: "Production proof completed against the public target.",
        patterns: Object.freeze([/PASS production proof checks/]),
      }),
      Object.freeze({
        id: "production-proof-live-evidence",
        message: "Production proof includes target URL, CI, Vercel, and public URL evidence lines.",
        patterns: Object.freeze([
          /Production proof target: https?:\/\/\S+/,
          /EVIDENCE GitHub Actions CI is green/,
          /EVIDENCE Vercel deployment status is successful/,
          /EVIDENCE The production proof command passes against the public URL/,
        ]),
      }),
    ]),
  }),
  Object.freeze({
    id: "hosted-ops-proof",
    optionName: "hostedOps",
    requiredPatterns: Object.freeze([
      Object.freeze({
        id: "hosted-ops-pass",
        message: "Hosted workspace and observability proof completed.",
        patterns: Object.freeze([/PASS hosted ops proof/]),
      }),
      Object.freeze({
        id: "hosted-ops-workspace-observability",
        message: "Hosted proof covered target URL, workspace store isolation, and durable observability receiver.",
        patterns: Object.freeze([
          /PASS hosted-ops-target app=https?:\/\/\S+/,
          /PASS workspace-store.*isolated=true.*tasks=1.*agentRuns=1/,
          /PASS observability-receiver durable=true/,
        ]),
      }),
    ]),
  }),
  Object.freeze({
    id: "hosted-ag2-proof",
    optionName: "hostedAg2",
    requiredPatterns: Object.freeze([
      Object.freeze({
        id: "hosted-ag2-pass",
        message: "Hosted AG2 proof completed.",
        patterns: Object.freeze([/PASS hosted AG2 proof/]),
      }),
      Object.freeze({
        id: "hosted-ag2-grounding-observability",
        message: "Hosted AG2 proof covered target URLs, readiness, grounded route output, and durable observability delivery.",
        patterns: Object.freeze([
          /PASS hosted-ag2-targets app=https?:\/\/\S+ service=https?:\/\/\S+/,
          /PASS ag2-demo-readiness/,
          /PASS grounded-entity-summary/,
          /PASS observability-delivery durable=true/,
        ]),
      }),
    ]),
  }),
]);

export function portfolioEvidenceMarkdown(report) {
  const lines = [
    "# Wikidata Explorer Portfolio Evidence",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.ok ? "PASS" : "FAIL"}`,
    `Release readiness: ${report.releaseReadiness.label} (${report.releaseReadiness.grade})`,
    `Readiness note: ${report.releaseReadiness.message}`,
    "",
    "## Provenance",
    "",
    `- Source: ${report.provenance.source}`,
    ...(report.provenance.repository ? [`- Repository: ${report.provenance.repository}`] : []),
    ...(report.provenance.workflow ? [`- Workflow: ${report.provenance.workflow}`] : []),
    ...(report.provenance.runId ? [`- Run: ${report.provenance.runId}${report.provenance.runAttempt ? ` attempt ${report.provenance.runAttempt}` : ""}`] : []),
    ...(report.provenance.runUrl ? [`- Run URL: ${report.provenance.runUrl}`] : []),
    ...(report.provenance.refName ? [`- Ref: ${report.provenance.refName}`] : []),
    ...(report.provenance.sha ? [`- SHA: ${report.provenance.sha}`] : []),
    "",
    "## Proofs",
    "",
    "| Proof | Required | Present | Status |",
    "| --- | --- | --- | --- |",
  ];

  for (const proof of report.proofs) {
    lines.push(`| ${proof.id} | ${proof.required ? "yes" : "no"} | ${proof.present ? "yes" : "no"} | ${proof.ok ? "PASS" : "FAIL"} |`);
  }

  lines.push(
    "",
    "## Hosted Targets",
    "",
    "| Proof | App URL | Service URL |",
    "| --- | --- | --- |",
  );

  for (const proof of report.proofs) {
    lines.push(`| ${proof.id} | ${proof.target.appUrl || "n/a"} | ${proof.target.serviceUrl || "n/a"} |`);
  }

  lines.push(
    "",
    "## Artifact Digests",
    "",
    "| Proof | File | Bytes | SHA-256 |",
    "| --- | --- | ---: | --- |",
  );

  for (const proof of report.proofs) {
    lines.push(`| ${proof.id} | ${proof.artifact.fileName} | ${proof.artifact.bytes} | ${proof.artifact.sha256 || "missing"} |`);
  }

  lines.push("", "## Checks", "");
  for (const proof of report.proofs) {
    lines.push(`### ${proof.id}`, "");
    for (const check of proof.checks) {
      lines.push(`- ${check.ok ? "PASS" : "FAIL"} ${check.id}: ${check.message}`);
    }
    lines.push("");
  }

  if (report.errors.length) {
    lines.push("## Errors", "");
    for (const error of report.errors) lines.push(`- ${error}`);
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

export async function portfolioEvidenceReport(options = {}) {
  const logDir = normalizeDir(options.logDir || ".");
  const logs = { ...DEFAULT_LOGS, ...(options.logs || {}) };
  const required = {
    production: options.requireProduction !== false,
    hostedOps: Boolean(options.requireHostedOps),
    hostedAg2: Boolean(options.requireHostedAg2),
  };

  const proofs = [];
  for (const spec of PROOF_SPECS) {
    const log = await readLog(logDir, logs[spec.optionName]);
    proofs.push(validateLog(log, spec, required[spec.optionName]));
  }

  const errors = proofs
    .flatMap((proof) => proof.checks.filter((check) => !check.ok).map((check) => `${proof.id}: ${check.message}`));

  return {
    ok: errors.length === 0,
    generatedAt: cleanOneLine(options.generatedAt || new Date().toISOString(), 80),
    logDir,
    releaseReadiness: releaseReadiness(required, errors.length === 0),
    provenance: provenanceFromEnv(options.env || process.env || {}),
    proofs,
    errors,
  };
}

export async function writePortfolioEvidenceSummary(report, options = {}) {
  const outputDir = normalizeDir(options.outputDir || report.logDir || ".");
  await mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, options.jsonFileName || "portfolio-evidence-summary.json");
  const markdownPath = path.join(outputDir, options.markdownFileName || "portfolio-evidence-summary.md");
  await writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
  await writeFile(markdownPath, portfolioEvidenceMarkdown(report), "utf8");
  return { jsonPath, markdownPath };
}
