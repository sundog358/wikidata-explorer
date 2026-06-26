import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildWorkspaceSnapshot } from "../lib/workspace-snapshot.mjs";
import {
  authorizeWorkspaceStore,
  buildProjectWorkspaceAgentRunIndex,
  buildProjectWorkspaceCurationTaskIndex,
  normalizeWorkspaceAccountId,
  normalizeWorkspaceProjectId,
  readProjectWorkspaceSlots,
  removeProjectWorkspaceSlot,
  summarizeProjectWorkspaceAgentRuns,
  summarizeProjectWorkspaceCurationTasks,
  upsertProjectWorkspaceSlot,
  workspaceStoreConfig,
} from "../lib/workspace-store.mjs";

assert.equal(normalizeWorkspaceProjectId("research_team-1"), "research_team-1");
assert.equal(normalizeWorkspaceProjectId("../bad"), "");
assert.equal(normalizeWorkspaceProjectId(""), "default");
assert.equal(normalizeWorkspaceAccountId("account_team-1"), "account_team-1");
assert.equal(normalizeWorkspaceAccountId("../bad"), "");
assert.equal(normalizeWorkspaceAccountId(""), "");
assert.deepEqual(workspaceStoreConfig({}), { enabled: false, reason: "store-dir-not-configured" });
assert.deepEqual(workspaceStoreConfig({ WORKSPACE_STORE_DIR: "tmp" }), { enabled: false, reason: "token-not-configured" });
assert.deepEqual(workspaceStoreConfig({ WORKSPACE_STORE_DIR: "tmp", WORKSPACE_STORE_TOKEN: "short" }), { enabled: false, reason: "token-too-short" });
assert.deepEqual(
  authorizeWorkspaceStore({ authorization: "Bearer wrong" }, { WORKSPACE_STORE_DIR: "tmp", WORKSPACE_STORE_TOKEN: "workspace-store-token" }),
  { authorized: false, status: 401, reason: "unauthorized" },
);

const storeDir = await mkdtemp(path.join(tmpdir(), "wikidata-workspace-store-"));
try {
  const env = {
    WORKSPACE_STORE_DIR: storeDir,
    WORKSPACE_STORE_TOKEN: "workspace-store-token",
  };
  const config = workspaceStoreConfig(env);
  assert.equal(config.enabled, true);
  assert.deepEqual(authorizeWorkspaceStore({ authorization: "Bearer workspace-store-token" }, env).authorized, true);

  const empty = await readProjectWorkspaceSlots({ config, projectId: "review-team" });
  assert.equal(empty.ok, true);
  assert.equal(empty.projectId, "review-team");
  assert.deepEqual(empty.slots, []);

  const createdAt = "2026-06-25T22:00:00.000Z";
  const firstSnapshot = buildWorkspaceSnapshot({
    entityId: "Q42",
    entityLabel: "Douglas Adams",
    createdAt,
    reviewTaskStatuses: { "Q42:claim:P31:unreferenced": "ready_to_draft" },
    dismissedReviewIds: ["Q42:old-warning"],
    curationTasks: [{
      id: "Q42:claim:P31:unreferenced",
      entityId: "Q42",
      propertyId: "P31",
      propertyLabel: "instance of",
      statementId: "Q42$claim",
      severity: "high",
      status: "ready_to_draft",
      title: "Add source",
      detail: "Persist this curation task token=FAKE_REDACTION_TEST_VALUE",
      value: "human",
      sourceHints: [{ kind: "stated-in", label: "stated in", value: "Some source", url: "https://www.wikidata.org/wiki/Q42" }],
    }],
    savedAgentRuns: [{
      id: "run-1",
      entityId: "Q42",
      entityLabel: "Douglas Adams",
      action: "verify",
      title: "Verifier",
      result: "Grounded result with token=FAKE_REDACTION_TEST_VALUE",
      createdAt,
    }],
  });

  const saved = await upsertProjectWorkspaceSlot({
    config,
    projectId: "review-team",
    slot: {
      id: "workspace-q42",
      label: "Q42 review workspace",
      snapshot: firstSnapshot,
      createdAt,
      updatedAt: "2026-06-25T22:05:00.000Z",
    },
  });
  assert.equal(saved.ok, true);
  assert.equal(saved.slots.length, 1);
  assert.equal(saved.slots[0].entityId, "Q42");
  assert.equal(saved.slots[0].snapshot.review.taskStatuses["Q42:claim:P31:unreferenced"], "ready_to_draft");
  assert.equal(saved.slots[0].snapshot.review.curationTasks[0].status, "ready_to_draft");
  assert.doesNotMatch(JSON.stringify(saved.slots), /FAKE_REDACTION_TEST_VALUE/);

  const taskIndex = buildProjectWorkspaceCurationTaskIndex(saved.slots);
  assert.equal(taskIndex.length, 1);
  assert.equal(taskIndex[0].id, "Q42:claim:P31:unreferenced");
  assert.equal(taskIndex[0].workspaceSlotId, "workspace-q42");
  assert.equal(taskIndex[0].workspaceEntityLabel, "Douglas Adams");
  assert.doesNotMatch(JSON.stringify(taskIndex), /FAKE_REDACTION_TEST_VALUE/);

  const taskSummary = summarizeProjectWorkspaceCurationTasks(saved.slots);
  assert.deepEqual(taskSummary.statusCounts, {
    needs_review: 0,
    checking_sources: 0,
    ready_to_draft: 1,
    resolved: 0,
  });
  assert.equal(taskSummary.open, 1);
  assert.equal(taskSummary.severityCounts.high, 1);

  const agentRunIndex = buildProjectWorkspaceAgentRunIndex(saved.slots);
  assert.equal(agentRunIndex.length, 1);
  assert.equal(agentRunIndex[0].id, "run-1");
  assert.equal(agentRunIndex[0].action, "verify");
  assert.equal(agentRunIndex[0].workspaceSlotId, "workspace-q42");
  assert.equal(agentRunIndex[0].workspaceEntityLabel, "Douglas Adams");
  assert.doesNotMatch(JSON.stringify(agentRunIndex), /FAKE_REDACTION_TEST_VALUE/);

  const agentSummary = summarizeProjectWorkspaceAgentRuns(saved.slots);
  assert.equal(agentSummary.total, 1);
  assert.equal(agentSummary.entities, 1);
  assert.equal(agentSummary.workspaces, 1);
  assert.equal(agentSummary.actionCounts.verify, 1);
  assert.equal(agentSummary.actionCounts.graph, 0);

  const persistedText = await readFile(path.join(storeDir, "review-team.json"), "utf8");
  assert.doesNotMatch(persistedText, /FAKE_REDACTION_TEST_VALUE/);
  const persisted = await readProjectWorkspaceSlots({ config, projectId: "review-team" });
  assert.equal(persisted.slots[0].label, "Q42 review workspace");

  const accountSaved = await upsertProjectWorkspaceSlot({
    config,
    accountId: "account-team",
    projectId: "review-team",
    slot: {
      id: "account-workspace-q42",
      label: "Account Q42 workspace",
      snapshot: firstSnapshot,
      createdAt,
      updatedAt: "2026-06-25T22:06:00.000Z",
    },
  });
  assert.equal(accountSaved.ok, true);
  assert.equal(accountSaved.accountId, "account-team");
  assert.equal(accountSaved.projectId, "review-team");
  assert.equal(accountSaved.slots[0].id, "account-workspace-q42");
  const accountPersistedText = await readFile(path.join(storeDir, "accounts", "account-team", "review-team.json"), "utf8");
  assert.doesNotMatch(accountPersistedText, /FAKE_REDACTION_TEST_VALUE/);
  const flatProjectAfterAccountSave = await readProjectWorkspaceSlots({ config, projectId: "review-team" });
  assert.equal(flatProjectAfterAccountSave.accountId, "");
  assert.equal(flatProjectAfterAccountSave.slots.some((slot) => slot.id === "account-workspace-q42"), false);
  const accountProject = await readProjectWorkspaceSlots({ config, accountId: "account-team", projectId: "review-team" });
  assert.equal(accountProject.accountId, "account-team");
  assert.equal(accountProject.slots.some((slot) => slot.id === "account-workspace-q42"), true);

  for (let index = 0; index < 16; index += 1) {
    await upsertProjectWorkspaceSlot({
      config,
      projectId: "review-team",
      slot: {
        id: `workspace-${index}`,
        label: `Workspace ${index}`,
        snapshot: buildWorkspaceSnapshot({ entityId: `Q${index + 1}`, createdAt }),
        createdAt,
        updatedAt: `2026-06-25T22:${String(index).padStart(2, "0")}:00.000Z`,
      },
    });
  }
  const bounded = await readProjectWorkspaceSlots({ config, projectId: "review-team" });
  assert.equal(bounded.slots.length, 12);

  const removed = await removeProjectWorkspaceSlot({ config, projectId: "review-team", slotId: bounded.slots[0].id });
  assert.equal(removed.ok, true);
  assert.equal(removed.slots.length, 11);

  const invalidProject = await readProjectWorkspaceSlots({ config, projectId: "../bad" });
  assert.equal(invalidProject.ok, false);
  assert.equal(invalidProject.status, 400);

  const invalidAccount = await readProjectWorkspaceSlots({ config, accountId: "../bad", projectId: "review-team" });
  assert.equal(invalidAccount.ok, false);
  assert.equal(invalidAccount.status, 400);
  assert.equal(invalidAccount.reason, "invalid-account-id");

  const invalidSlot = await upsertProjectWorkspaceSlot({ config, projectId: "review-team", slot: { id: "bad" } });
  assert.equal(invalidSlot.ok, false);
  assert.equal(invalidSlot.status, 400);
} finally {
  await rm(storeDir, { recursive: true, force: true });
}

console.log("PASS workspace store tests");
