import assert from "node:assert/strict";
import {
  buildWorkspaceSnapshot,
  parseWorkspaceSnapshot,
  readWorkspaceSlotCollection,
  removeWorkspaceSlot,
  sanitizeWorkspaceAgentRuns,
  sanitizeWorkspaceCurationTasks,
  sanitizeWorkspaceDismissedReviewIds,
  sanitizeWorkspaceSlot,
  sanitizeWorkspaceReviewTaskStatuses,
  upsertWorkspaceSlot,
} from "../lib/workspace-snapshot.mjs";

const createdAt = "2026-06-25T22:00:00.000Z";

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

const curationTasks = sanitizeWorkspaceCurationTasks([
  {
    id: "Q42:Q42$abc:P31:unreferenced",
    entityId: "q42",
    propertyId: "p31",
    propertyLabel: "instance of",
    statementId: "Q42$abc",
    severity: "high",
    status: "ready_to_draft",
    title: "Add source",
    detail: "Needs source token=FAKE_REDACTION_TEST_VALUE",
    value: "human",
    sourceHints: [
      { kind: "stated-in", label: "stated in", value: "Some source", url: "https://www.wikidata.org/wiki/Q42" },
      { kind: "bad", label: "secret", value: "Bearer FAKE_REDACTION_TEST_VALUE" },
    ],
  },
  {
    id: "bad",
    entityId: "bad-id",
    propertyId: "P31",
  },
]);
assert.equal(curationTasks.length, 1);
assert.equal(curationTasks[0].entityId, "Q42");
assert.equal(curationTasks[0].propertyId, "P31");
assert.equal(curationTasks[0].severity, "high");
assert.equal(curationTasks[0].status, "ready_to_draft");
assert.equal(curationTasks[0].sourceHints[0].url, "https://www.wikidata.org/wiki/Q42");
assert.doesNotMatch(JSON.stringify(curationTasks), /FAKE_REDACTION_TEST_VALUE/);

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
  curationTasks,
  savedAgentRuns: sanitizedRuns,
  createdAt,
});

assert.equal(snapshot.artifactType, "wikidata-explorer-workspace");
assert.equal(snapshot.version, 1);
assert.equal(snapshot.entity.id, "Q42");
assert.equal(snapshot.review.dismissedIds[0], "Q42:deprecated");
assert.equal(snapshot.review.curationTasks[0].title, "Add source");
assert.equal(snapshot.agentRuns.length, 1);

const parsed = parseWorkspaceSnapshot(JSON.stringify(snapshot));
assert.equal(parsed.ok, true);
assert.equal(parsed.snapshot.entity.id, "Q42");
assert.equal(parsed.snapshot.review.taskStatuses["Q42:Q42$abc:P31:deprecated"], "ready_to_draft");
assert.equal(parsed.snapshot.review.curationTasks[0].propertyId, "P31");

const unsupported = parseWorkspaceSnapshot(JSON.stringify({ artifactType: "other", version: 1 }));
assert.equal(unsupported.ok, false);
assert.match(unsupported.error, /not supported/);

const invalidJson = parseWorkspaceSnapshot("{not json");
assert.equal(invalidJson.ok, false);
assert.match(invalidJson.error, /not valid JSON/);

const slot = sanitizeWorkspaceSlot({
  id: "slot-q42",
  label: "Douglas review",
  snapshot,
  createdAt,
  updatedAt: "2026-06-25T22:10:00.000Z",
});
assert.equal(slot.id, "slot-q42");
assert.equal(slot.entityId, "Q42");
assert.equal(slot.label, "Douglas review");
assert.equal(slot.snapshot.agentRuns[0].result.includes("FAKE_REDACTION_TEST_VALUE"), false);

assert.equal(sanitizeWorkspaceSlot({ id: "bad", snapshot: { artifactType: "other", version: 1 } }), null);
assert.deepEqual(readWorkspaceSlotCollection("{not json"), []);
assert.deepEqual(readWorkspaceSlotCollection({}), []);

let slots = readWorkspaceSlotCollection([
  {
    id: "slot-old",
    label: "Older",
    snapshot: buildWorkspaceSnapshot({ entityId: "Q80", entityLabel: "Tim Berners-Lee", createdAt }),
    createdAt,
    updatedAt: "2026-06-25T21:00:00.000Z",
  },
  slot,
]);
assert.deepEqual(slots.map((item) => item.id), ["slot-q42", "slot-old"]);

slots = upsertWorkspaceSlot(slots, {
  id: "slot-old",
  label: "Updated older slot",
  snapshot: buildWorkspaceSnapshot({ entityId: "Q80", entityLabel: "Tim Berners-Lee", createdAt }),
  createdAt,
  updatedAt: "2026-06-25T22:20:00.000Z",
});
assert.deepEqual(slots.map((item) => item.id), ["slot-old", "slot-q42"]);
assert.equal(slots[0].label, "Updated older slot");

const manySlots = Array.from({ length: 16 }, (_, index) => ({
  id: `slot-${index}`,
  label: `Slot ${index}`,
  snapshot: buildWorkspaceSnapshot({ entityId: `Q${index + 1}`, createdAt }),
  createdAt,
  updatedAt: `2026-06-25T22:${String(index).padStart(2, "0")}:00.000Z`,
}));
assert.equal(readWorkspaceSlotCollection(manySlots).length, 12);
assert.equal(readWorkspaceSlotCollection(manySlots)[0].id, "slot-15");

assert.deepEqual(removeWorkspaceSlot(slots, "slot-old").map((item) => item.id), ["slot-q42"]);

console.log("PASS workspace snapshot tests");
