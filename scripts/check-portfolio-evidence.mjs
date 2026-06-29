import {
  portfolioEvidenceReport,
  writePortfolioEvidenceSummary,
} from "../lib/portfolio-evidence.mjs";

function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

function optionValue(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const report = await portfolioEvidenceReport({
  logDir: optionValue("dir", "."),
  requireProduction: !hasFlag("no-require-production"),
  requireHostedOps: hasFlag("require-hosted-ops"),
  requireHostedAg2: hasFlag("require-hosted-ag2"),
});
const summary = await writePortfolioEvidenceSummary(report, {
  outputDir: optionValue("out-dir", optionValue("dir", ".")),
});

for (const proof of report.proofs) {
  const prefix = proof.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${proof.id}: required=${proof.required} present=${proof.present}`);
  for (const check of proof.checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.id}: ${check.message}`);
  }
}

console.log(`EVIDENCE summary JSON ${summary.jsonPath}`);
console.log(`EVIDENCE summary Markdown ${summary.markdownPath}`);

if (!report.ok) {
  for (const error of report.errors) console.error(`FAIL ${error}`);
  process.exit(1);
}

console.log("PASS portfolio evidence summary");
