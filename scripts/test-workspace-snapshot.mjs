import assert from "node:assert/strict";
import {
  buildWorkspaceSnapshot,
  parseWorkspaceSnapshot,
  sanitizeWorkspaceAgentRuns,
  sanitizeWorkspaceDismissedReviewIds,
  sanitizeWorkspaceReviewTaskStatuses,
} from "../lib/workspace-snapshot.mjs";

const reviewStatuses = sanitizeWorkspaceReviewTaskStatuses({
  "Q42:Q42$abc:P31:deprecated": "ready_to_draft",
  "Q42:Q42$def:P106:unreferenced": "checking_sources",
  "Q42:bad": "invalid_status",
  "": "resolved",
});

assert.deepEqual(reviewStatuses, {
  "Q42:Q42$abc:P31:deprecated": "ready_to_draft",
  "Q42:Q42$def:P106:unreferenced": "checking_sources",
});

assert.deepEqual(sanitizeWorkspaceDismissedReviewIds(["a", "a", "b\nc", "", null]), ["a", "b c"]);

const sanitizedRuns = sanitizeWorkspaceAgentRuns([
  {
    id: "run-1",
    entityId: "q42",
    entityLabel: "Douglas Adams",
    action: "verify",
    title: "Verifier",
    result: "Looks grounded. token=FAKE_REDACTION_TEST_VALUE",
    compareEntityId: "q80",
    safety: {
      decisionLabel: "Allowed",
      risk: "low",
      modeLabel: "Draft only",
      reasons: ["Read-only review"],
      requiredControls: ["Human review"],
    },
    graphFocus: {
      id: "q5",
      label: "human",
      property: "instance of",
      propertyId: "p31",
      rank: "preferred",
      referenceCount: 2,
    },
    createdAt: "2026-06-25T21:45:00.000Z",
  },
  {
    entityId: "bad-id",
    action: "verify",
  },
  {
    entityId: "Q42",
    action: "delete",
  },
]);

assert.equal(sanitizedRuns.length, 1);
assert.equal(sanitizedRuns[0].entityId, "Q42");
assert.equal(sanitizedRuns[0].compareEntityId, "Q80");
assert.equal(sanitizedRuns[0].graphFocus.id, "Q5");
assert.equal(sanitizedRuns[0].graphFocus.propertyId, "P31");
assert.doesNotMatch(sanitizedRuns[0].result, /FAKE_REDACTION_TEST_VALUE/);

const snapshot = buildWorkspaceSnapshot({
  entityId: "q42",
  entityLabel: "Douglas Adams",
  reviewTaskStatuses: reviewStatuses,
  dismissedReviewIds: ["Q42:deprecated"],
  savedAgentRuns: sanitizedRuns,
  createdAt: "2026-06-25T22:00:00.000Z",
});

assert.equal(snapshot.artifactType, "wikidata-explorer-workspace");
assert.equal(snapshot.version, 1);
assert.equal(snapshot.entity.id, "Q42");
assert.equal(snapshot.review.dismissedIds[0], "Q42:deprecated");
assert.equal(snapshot.agentRuns.length, 1);

const parsed = parseWorkspaceSnapshot(JSON.stringify(snapshot));
assert.equal(parsed.ok, true);
assert.equal(parsed.snapshot.entity.id, "Q42");
assert.equal(parsed.snapshot.review.taskStatuses["Q42:Q42$abc:P31:deprecated"], "ready_to_draft");

const unsupported = parseWorkspaceSnapshot(JSON.stringify({ artifactType: "other", version: 1 }));
assert.equal(unsupported.ok, false);
assert.match(unsupported.error, /not supported/);

const invalidJson = parseWorkspaceSnapshot("{not json");
assert.equal(invalidJson.ok, false);
assert.match(invalidJson.error, /not valid JSON/);

console.log("PASS workspace snapshot tests");
