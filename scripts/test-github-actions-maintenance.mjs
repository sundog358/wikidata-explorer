import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const productionProofWorkflow = readFileSync(new URL("../.github/workflows/production-proof.yml", import.meta.url), "utf8");
const workflows = `${workflow}\n${productionProofWorkflow}`;

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
assert.match(productionProofWorkflow, /production-proof-log/, "Production proof workflow should upload the proof log as an artifact.");
assert.match(productionProofWorkflow, /hosted-ops-proof\.log/, "Production proof workflow should include the hosted ops proof log in the artifact when enabled.");
assert.match(productionProofWorkflow, /node-version:\s*20/, "Production proof should use the documented Node 20+ app runtime.");

console.log("PASS GitHub Actions maintenance tests");
