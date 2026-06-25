import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildWorkspaceSnapshot } from "../lib/workspace-snapshot.mjs";
import {
  authorizeWorkspaceStore,
  normalizeWorkspaceProjectId,
  readProjectWorkspaceSlots,
  removeProjectWorkspaceSlot,
  upsertProjectWorkspaceSlot,
  workspaceStoreConfig,
} from "../lib/workspace-store.mjs";

assert.equal(normalizeWorkspaceProjectId("research_team-1"), "research_team-1");
assert.equal(normalizeWorkspaceProjectId("../bad"), "");
assert.equal(normalizeWorkspaceProjectId(""), "default");
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
  assert.doesNotMatch(JSON.stringify(saved.slots), /FAKE_REDACTION_TEST_VALUE/);

  const persistedText = await readFile(path.join(storeDir, "review-team.json"), "utf8");
  assert.doesNotMatch(persistedText, /FAKE_REDACTION_TEST_VALUE/);
  const persisted = await readProjectWorkspaceSlots({ config, projectId: "review-team" });
  assert.equal(persisted.slots[0].label, "Q42 review workspace");

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

  const invalidSlot = await upsertProjectWorkspaceSlot({ config, projectId: "review-team", slot: { id: "bad" } });
  assert.equal(invalidSlot.ok, false);
  assert.equal(invalidSlot.status, 400);
} finally {
  await rm(storeDir, { recursive: true, force: true });
}

console.log("PASS workspace store tests");
