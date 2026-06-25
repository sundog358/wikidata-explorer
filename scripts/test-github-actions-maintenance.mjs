import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");

const expectedActionRefs = [
  "actions/checkout@v7",
  "actions/setup-node@v6",
  "browser-actions/setup-chrome@v2.1.2",
  "actions/upload-artifact@v7",
];

for (const actionRef of expectedActionRefs) {
  assert.match(workflow, new RegExp(`uses:\\s*${actionRef.replaceAll("/", "\\/").replaceAll(".", "\\.")}`), `${actionRef} should stay on the Node 24-compatible CI action line.`);
}

const staleActionRefs = [
  "actions/checkout@v4",
  "actions/setup-node@v4",
  "browser-actions/setup-chrome@v1",
  "actions/upload-artifact@v4",
];

for (const actionRef of staleActionRefs) {
  assert.doesNotMatch(workflow, new RegExp(actionRef.replaceAll("/", "\\/").replaceAll(".", "\\.")), `${actionRef} should not return to CI.`);
}

assert.match(workflow, /node-version:\s*20/, "CI should continue testing the documented Node 20+ app runtime until the project runtime floor changes intentionally.");
assert.match(workflow, /API_OBSERVABILITY_RECEIVER_TOKEN:\s*ci-observability-receiver-token/, "CI should keep a dummy receiver token so API contracts exercise the protected observability receiver route.");
assert.match(workflow, /WORKSPACE_STORE_TOKEN:\s*ci-workspace-store-token/, "CI should keep a dummy workspace store token so API contracts exercise project-backed workspace persistence.");

console.log("PASS GitHub Actions maintenance tests");
