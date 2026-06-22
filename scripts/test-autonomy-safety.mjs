import assert from "node:assert/strict";
import { evaluateAutonomyAction } from "../lib/autonomy-safety.mjs";

const readOnly = evaluateAutonomyAction({
  action: "research",
  mode: "read_only",
  entityId: "Q42",
  dryRun: true,
});
assert.equal(readOnly.allowed, true);
assert.equal(readOnly.risk, "low");
assert.equal(readOnly.mode, "read_only");

const compareWithoutTarget = evaluateAutonomyAction({
  action: "compare",
  mode: "read_only",
  entityId: "Q42",
});
assert.equal(compareWithoutTarget.allowed, false);
assert.match(compareWithoutTarget.reasons.join(" "), /second Wikidata entity ID/);

const blockedWrite = evaluateAutonomyAction({
  action: "wikidata_write",
  mode: "read_only",
  entityId: "Q42",
  dryRun: true,
});
assert.equal(blockedWrite.allowed, false);
assert.match(blockedWrite.reasons.join(" "), /does not allow external writes/);

const supervisedWriteNeedsApproval = evaluateAutonomyAction({
  action: "wikidata_write",
  mode: "supervised_bot",
  entityId: "Q42",
  dryRun: false,
});
assert.equal(supervisedWriteNeedsApproval.allowed, false);
assert.match(supervisedWriteNeedsApproval.reasons.join(" "), /Human approval/);
assert.match(supervisedWriteNeedsApproval.reasons.join(" "), /Approved Wikidata bot/);

const supervisedWriteAllowed = evaluateAutonomyAction({
  action: "wikidata_write",
  mode: "supervised_bot",
  entityId: "Q42",
  dryRun: false,
  humanApproved: true,
  botApproved: true,
  batchSize: 5,
});
assert.equal(supervisedWriteAllowed.allowed, true);

const massEditBlocked = evaluateAutonomyAction({
  action: "mass_edit",
  mode: "supervised_bot",
  entityId: "Q42",
  dryRun: false,
  humanApproved: true,
  botApproved: true,
  batchSize: 5,
});
assert.equal(massEditBlocked.allowed, false);
assert.match(massEditBlocked.reasons.join(" "), /critical risk/);

console.log("PASS autonomy safety policy tests");
