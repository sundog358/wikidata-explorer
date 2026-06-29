import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const productionProofWorkflow = readFileSync(new URL("../.github/workflows/production-proof.yml", import.meta.url), "utf8");
const ag2DemoProofWorkflow = readFileSync(new URL("../.github/workflows/ag2-demo-proof.yml", import.meta.url), "utf8");
const workflows = `${workflow}\n${productionProofWorkflow}\n${ag2DemoProofWorkflow}`;

function workflowRunBlocks(workflowText) {
  const blocks = [];
  const lines = workflowText.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const blockMatch = lines[index].match(/^(\s*)run:\s*\|\s*$/);
    if (blockMatch) {
      const parentIndent = blockMatch[1].length;
      const blockLines = [];
      index += 1;
      while (index < lines.length) {
        const line = lines[index];
        const indent = line.match(/^(\s*)/)?.[1].length || 0;
        if (line.trim() && indent <= parentIndent) {
          index -= 1;
          break;
        }
        blockLines.push(line);
        index += 1;
      }
      blocks.push(blockLines.join("\n"));
      continue;
    }

    const inlineMatch = lines[index].match(/^\s*run:\s*(.+)$/);
    if (inlineMatch) blocks.push(inlineMatch[1]);
  }
  return blocks;
}

function assertPipefailProtectedTee(workflowText, logName) {
  const matchingBlocks = workflowRunBlocks(workflowText).filter((block) => block.includes(`tee ${logName}`));
  assert.ok(matchingBlocks.length > 0, `${logName} should be captured with tee.`);
  for (const block of matchingBlocks) {
    assert.match(block, /set -o pipefail/, `${logName} tee capture should preserve proof command failures.`);
  }
}

const expectedActionRefs = [
  "actions/checkout@v7",
  "actions/setup-node@v6",
  "browser-actions/setup-chrome@v2.1.2",
  "actions/upload-artifact@v7",
];

for (const actionRef of expectedActionRefs) {
  assert.match(workflows, new RegExp(`uses:\\s*${actionRef.replaceAll("/", "\\/").replaceAll(".", "\\.")}`), `${actionRef} should stay on the Node 24-compatible CI action line.`);
}

const staleActionRefs = [
  "actions/checkout@v4",
  "actions/setup-node@v4",
  "browser-actions/setup-chrome@v1",
  "actions/upload-artifact@v4",
];

for (const actionRef of staleActionRefs) {
  assert.doesNotMatch(workflows, new RegExp(actionRef.replaceAll("/", "\\/").replaceAll(".", "\\.")), `${actionRef} should not return to CI.`);
}

assert.match(workflow, /node-version:\s*20/, "CI should continue testing the documented Node 20+ app runtime until the project runtime floor changes intentionally.");
assert.match(workflow, /API_OBSERVABILITY_RECEIVER_TOKEN:\s*ci-observability-receiver-token/, "CI should keep a dummy receiver token so API contracts exercise the protected observability receiver route.");
assert.match(workflow, /WORKSPACE_STORE_TOKEN:\s*ci-workspace-store-token/, "CI should keep a dummy workspace store token so API contracts exercise project-backed workspace persistence.");
assert.match(productionProofWorkflow, /workflow_dispatch:/, "Production proof should stay manually runnable after deployment.");
assert.match(productionProofWorkflow, /default:\s*https:\/\/www\.wikidataexplorer\.com/, "Production proof should default to the public portfolio URL.");
assert.match(productionProofWorkflow, /npm run production:proof/, "Production proof workflow should execute the live proof command.");
assert.match(productionProofWorkflow, /run_ops_proof:/, "Production proof workflow should expose an opt-in hosted ops proof input.");
assert.match(productionProofWorkflow, /npm run ops:proof/, "Production proof workflow should be able to execute hosted ops proof.");
assert.match(productionProofWorkflow, /PRODUCTION_WORKSPACE_STORE_TOKEN/, "Production proof workflow should read the workspace proof token from repository secrets.");
assert.match(productionProofWorkflow, /PRODUCTION_OBSERVABILITY_RECEIVER_TOKEN/, "Production proof workflow should read the observability proof token from repository secrets.");
assert.match(productionProofWorkflow, /run_ag2_proof:/, "Production proof workflow should expose an opt-in hosted AG2 proof input.");
assert.match(productionProofWorkflow, /ai_app_base_url:/, "Production proof workflow should accept an optional AI-enabled app URL for hosted AG2 proof.");
assert.match(productionProofWorkflow, /ag2_service_url:/, "Production proof workflow should accept the hosted AG2 service URL.");
assert.match(productionProofWorkflow, /npm run ag2:hosted:proof/, "Production proof workflow should be able to execute hosted AG2 proof.");
assert.match(productionProofWorkflow, /Preflight hosted ops proof/, "Production proof workflow should preflight hosted ops proof inputs before running the proof.");
assert.match(productionProofWorkflow, /--scope=ops/, "Production proof workflow should run an ops-scoped hosted preflight.");
assert.match(productionProofWorkflow, /Preflight hosted AG2 proof/, "Production proof workflow should preflight hosted AG2 proof inputs before running the proof.");
assert.match(productionProofWorkflow, /--scope=ag2/, "Production proof workflow should run an AG2-scoped hosted preflight.");
assert.match(productionProofWorkflow, /AI_APP_BASE_URL/, "Production proof workflow should preflight AG2 against the selected AI app URL.");
assert.match(productionProofWorkflow, /inputs\.ai_app_base_url != '' && inputs\.ai_app_base_url \|\| inputs\.base_url/, "Production proof workflow should fall back from ai_app_base_url to base_url.");
assert.match(productionProofWorkflow, /npm run portfolio:hosted:preflight/, "Production proof workflow should fail fast on missing hosted proof wiring.");
assert.match(productionProofWorkflow, /npm run portfolio:evidence/, "Production proof workflow should summarize portfolio evidence logs.");
assert.match(productionProofWorkflow, /--require-hosted-ops/, "Production proof workflow should require hosted ops evidence when that proof is enabled.");
assert.match(productionProofWorkflow, /--require-hosted-ag2/, "Production proof workflow should require hosted AG2 evidence when that proof is enabled.");
assert.match(productionProofWorkflow, /Validate portfolio 10 artifact/, "Production proof workflow should validate the final 10/10 artifact when both hosted proofs run.");
assert.match(productionProofWorkflow, /inputs\.run_ops_proof && inputs\.run_ag2_proof/, "Production proof workflow should run the final 10/10 artifact gate only when both hosted proofs are enabled.");
assert.match(productionProofWorkflow, /npm run portfolio:10:check -- --dir=\./, "Production proof workflow should run the same final 10/10 readiness command documented for downloaded artifacts.");
assert.match(productionProofWorkflow, /tee portfolio-10-check\.log/, "Production proof workflow should capture the final 10/10 gate output for artifact review.");
for (const logName of [
  "production-proof.log",
  "hosted-ops-proof.log",
  "ag2-hosted-proof.log",
  "portfolio-evidence.log",
  "portfolio-10-check.log",
]) {
  assertPipefailProtectedTee(productionProofWorkflow, logName);
}
assert.match(productionProofWorkflow, /AG2_DEMO_SERVICE_TOKEN/, "Production proof workflow should read the AG2 demo service token from repository secrets.");
assert.match(productionProofWorkflow, /AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN/, "Production proof workflow should read the AG2 demo observability token from repository secrets.");
assert.match(productionProofWorkflow, /production-proof-log/, "Production proof workflow should upload the proof log as an artifact.");
assert.match(productionProofWorkflow, /hosted-ops-proof\.log/, "Production proof workflow should include the hosted ops proof log in the artifact when enabled.");
assert.match(productionProofWorkflow, /ag2-hosted-proof\.log/, "Production proof workflow should include the hosted AG2 proof log in the artifact when enabled.");
assert.match(productionProofWorkflow, /portfolio-evidence-summary\.md/, "Production proof workflow should include the evidence summary markdown in the artifact.");
assert.match(productionProofWorkflow, /portfolio-evidence-summary\.json/, "Production proof workflow should include the evidence summary JSON in the artifact.");
assert.match(productionProofWorkflow, /portfolio-10-check\.log/, "Production proof workflow should include the final 10/10 gate log in the artifact.");
assert.match(productionProofWorkflow, /GITHUB_STEP_SUMMARY/, "Production proof workflow should publish the evidence summary in the GitHub run summary.");
assert.match(productionProofWorkflow, /cat portfolio-evidence-summary\.md >> "\$GITHUB_STEP_SUMMARY"/, "Production proof workflow should append the markdown summary to the GitHub run summary.");
assert.match(productionProofWorkflow, /node-version:\s*20/, "Production proof should use the documented Node 20+ app runtime.");
assert.match(ag2DemoProofWorkflow, /workflow_dispatch:/, "AG2 demo proof should stay manually runnable for intentional AI-enabled demos.");
assert.match(ag2DemoProofWorkflow, /Preflight hosted AG2 proof/, "AG2 demo proof workflow should preflight hosted proof inputs before running the proof.");
assert.match(ag2DemoProofWorkflow, /npm run portfolio:hosted:preflight/, "AG2 demo proof workflow should fail fast on missing hosted proof wiring.");
assert.match(ag2DemoProofWorkflow, /--scope=ag2/, "AG2 demo proof workflow should run an AG2-scoped hosted preflight.");
assert.match(ag2DemoProofWorkflow, /npm run ag2:hosted:proof/, "AG2 demo proof workflow should execute the hosted AG2 proof command.");
assert.match(ag2DemoProofWorkflow, /npm run portfolio:evidence/, "AG2 demo proof workflow should summarize hosted AG2 evidence logs.");
assert.match(ag2DemoProofWorkflow, /--no-require-production --require-hosted-ag2/, "AG2 demo proof workflow should validate AG2-only evidence.");
for (const logName of [
  "ag2-hosted-proof.log",
  "portfolio-evidence.log",
]) {
  assertPipefailProtectedTee(ag2DemoProofWorkflow, logName);
}
assert.match(ag2DemoProofWorkflow, /AG2_DEMO_SERVICE_TOKEN/, "AG2 demo proof workflow should read the service token from repository secrets.");
assert.match(ag2DemoProofWorkflow, /AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN/, "AG2 demo proof workflow should read the observability receiver token from repository secrets.");
assert.match(ag2DemoProofWorkflow, /ag2-hosted-proof-log/, "AG2 demo proof workflow should upload the hosted proof log as an artifact.");
assert.match(ag2DemoProofWorkflow, /portfolio-evidence-summary\.md/, "AG2 demo proof workflow should include the evidence summary markdown in the artifact.");
assert.match(ag2DemoProofWorkflow, /GITHUB_STEP_SUMMARY/, "AG2 demo proof workflow should publish the evidence summary in the GitHub run summary.");
assert.match(ag2DemoProofWorkflow, /cat portfolio-evidence-summary\.md >> "\$GITHUB_STEP_SUMMARY"/, "AG2 demo proof workflow should append the markdown summary to the GitHub run summary.");
assert.match(ag2DemoProofWorkflow, /node-version:\s*20/, "AG2 demo proof should use the documented Node 20+ app runtime.");

console.log("PASS GitHub Actions maintenance tests");
