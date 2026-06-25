import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  readWorkspaceSlotCollection,
  removeWorkspaceSlot,
  sanitizeWorkspaceSlot,
  upsertWorkspaceSlot,
} from "./workspace-snapshot.mjs";

const DEFAULT_PROJECT_ID = "default";
const REVIEW_STATUS_ORDER = {
  ready_to_draft: 0,
  checking_sources: 1,
  needs_review: 2,
  resolved: 3,
};
const AGENT_ACTIONS = ["research", "graph", "suggest", "verify", "compare", "report"];

function cleanOneLine(value = "", maxLength = 120) {
  return String(value ?? "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeWorkspaceProjectId(value = DEFAULT_PROJECT_ID) {
  const id = cleanOneLine(value || DEFAULT_PROJECT_ID, 64);
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id) ? id : "";
}

export function workspaceStoreConfig(env = {}) {
  const rootDir = cleanOneLine(env.WORKSPACE_STORE_DIR || "", 500);
  const token = cleanOneLine(env.WORKSPACE_STORE_TOKEN || "", 500);
  if (!rootDir) return { enabled: false, reason: "store-dir-not-configured" };
  if (!token) return { enabled: false, reason: "token-not-configured" };
  if (token.length < 16) return { enabled: false, reason: "token-too-short" };

  return {
    enabled: true,
    rootDir: path.resolve(rootDir),
    token,
  };
}

export function authorizeWorkspaceStore(headers = {}, env = {}) {
  const config = workspaceStoreConfig(env);
  if (!config.enabled) return { authorized: false, status: 503, reason: config.reason };

  const headerValue = typeof headers.get === "function"
    ? headers.get("authorization")
    : headers.authorization || headers.Authorization || "";
  if (String(headerValue || "") !== `Bearer ${config.token}`) {
    return { authorized: false, status: 401, reason: "unauthorized" };
  }

  return { authorized: true, config };
}

function projectFilePath(config, projectId) {
  const normalizedProjectId = normalizeWorkspaceProjectId(projectId);
  if (!normalizedProjectId) return null;

  const rootDir = path.resolve(config.rootDir);
  const filePath = path.resolve(rootDir, `${normalizedProjectId}.json`);
  const relative = path.relative(rootDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return filePath;
}

export async function readProjectWorkspaceSlots(options = {}) {
  const config = options.config || workspaceStoreConfig(options.env || process.env || {});
  if (!config.enabled) return { ok: false, status: 503, reason: config.reason, projectId: "", slots: [] };

  const projectId = normalizeWorkspaceProjectId(options.projectId);
  const filePath = projectFilePath(config, projectId);
  if (!projectId || !filePath) return { ok: false, status: 400, reason: "invalid-project-id", projectId: "", slots: [] };

  try {
    const value = await readFile(filePath, "utf8");
    return { ok: true, projectId, slots: readWorkspaceSlotCollection(value) };
  } catch (error) {
    if (error?.code === "ENOENT") return { ok: true, projectId, slots: [] };
    return { ok: false, status: 500, reason: "store-read-failed", projectId, slots: [] };
  }
}

export function buildProjectWorkspaceCurationTaskIndex(slots = []) {
  const latestByTaskId = new Map();

  for (const slot of readWorkspaceSlotCollection(slots)) {
    const tasks = Array.isArray(slot.snapshot?.review?.curationTasks) ? slot.snapshot.review.curationTasks : [];
    for (const task of tasks) {
      const current = latestByTaskId.get(task.id);
      if (current && current.workspaceUpdatedAt >= slot.updatedAt) continue;

      latestByTaskId.set(task.id, {
        ...task,
        workspaceSlotId: slot.id,
        workspaceSlotLabel: slot.label,
        workspaceEntityId: slot.entityId,
        workspaceEntityLabel: slot.entityLabel,
        workspaceUpdatedAt: slot.updatedAt,
      });
    }
  }

  return Array.from(latestByTaskId.values())
    .sort((a, b) => {
      if (a.status === "resolved" && b.status !== "resolved") return 1;
      if (a.status !== "resolved" && b.status === "resolved") return -1;
      if (a.severity !== b.severity) return a.severity === "high" ? -1 : 1;
      const statusOrder = (REVIEW_STATUS_ORDER[a.status] ?? 9) - (REVIEW_STATUS_ORDER[b.status] ?? 9);
      if (statusOrder !== 0) return statusOrder;
      const updatedOrder = b.workspaceUpdatedAt.localeCompare(a.workspaceUpdatedAt);
      if (updatedOrder !== 0) return updatedOrder;
      return a.propertyLabel.localeCompare(b.propertyLabel);
    })
    .slice(0, 100);
}

export function summarizeProjectWorkspaceCurationTasks(slots = []) {
  const curationTasks = buildProjectWorkspaceCurationTaskIndex(slots);
  const statusCounts = {
    needs_review: 0,
    checking_sources: 0,
    ready_to_draft: 0,
    resolved: 0,
  };
  const severityCounts = {
    high: 0,
    medium: 0,
  };
  const entityIds = new Set();
  const propertyIds = new Set();
  const workspaceSlotIds = new Set();

  for (const task of curationTasks) {
    if (Object.hasOwn(statusCounts, task.status)) statusCounts[task.status] += 1;
    if (Object.hasOwn(severityCounts, task.severity)) severityCounts[task.severity] += 1;
    if (task.entityId) entityIds.add(task.entityId);
    if (task.propertyId) propertyIds.add(task.propertyId);
    if (task.workspaceSlotId) workspaceSlotIds.add(task.workspaceSlotId);
  }

  return {
    total: curationTasks.length,
    open: curationTasks.filter((task) => task.status !== "resolved").length,
    entities: entityIds.size,
    properties: propertyIds.size,
    workspaces: workspaceSlotIds.size,
    statusCounts,
    severityCounts,
  };
}

export function buildProjectWorkspaceAgentRunIndex(slots = []) {
  const latestByRunId = new Map();

  for (const slot of readWorkspaceSlotCollection(slots)) {
    const runs = Array.isArray(slot.snapshot?.agentRuns) ? slot.snapshot.agentRuns : [];
    for (const run of runs) {
      if (!run || typeof run !== "object" || Array.isArray(run)) continue;
      const runId = cleanOneLine(run.id, 160);
      if (!runId) continue;

      const createdAt = cleanOneLine(run.createdAt, 80);
      const current = latestByRunId.get(runId);
      if (current && current.createdAt >= createdAt) continue;

      latestByRunId.set(runId, {
        ...run,
        id: runId,
        workspaceSlotId: slot.id,
        workspaceSlotLabel: slot.label,
        workspaceEntityId: slot.entityId,
        workspaceEntityLabel: slot.entityLabel,
        workspaceUpdatedAt: slot.updatedAt,
      });
    }
  }

  return Array.from(latestByRunId.values())
    .sort((a, b) => {
      const createdOrder = b.createdAt.localeCompare(a.createdAt);
      if (createdOrder !== 0) return createdOrder;
      return b.workspaceUpdatedAt.localeCompare(a.workspaceUpdatedAt);
    })
    .slice(0, 100);
}

export function summarizeProjectWorkspaceAgentRuns(slots = []) {
  const agentRuns = buildProjectWorkspaceAgentRunIndex(slots);
  const actionCounts = Object.fromEntries(AGENT_ACTIONS.map((action) => [action, 0]));
  const entityIds = new Set();
  const workspaceSlotIds = new Set();

  for (const run of agentRuns) {
    if (Object.hasOwn(actionCounts, run.action)) actionCounts[run.action] += 1;
    if (run.entityId) entityIds.add(run.entityId);
    if (run.workspaceSlotId) workspaceSlotIds.add(run.workspaceSlotId);
  }

  return {
    total: agentRuns.length,
    entities: entityIds.size,
    workspaces: workspaceSlotIds.size,
    lastRunAt: agentRuns[0]?.createdAt || null,
    actionCounts,
  };
}

export async function writeProjectWorkspaceSlots(options = {}) {
  const config = options.config || workspaceStoreConfig(options.env || process.env || {});
  if (!config.enabled) return { ok: false, status: 503, reason: config.reason, projectId: "", slots: [] };

  const projectId = normalizeWorkspaceProjectId(options.projectId);
  const filePath = projectFilePath(config, projectId);
  if (!projectId || !filePath) return { ok: false, status: 400, reason: "invalid-project-id", projectId: "", slots: [] };

  const slots = readWorkspaceSlotCollection(options.slots);
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${Date.now()}.tmp`;
    await writeFile(tempPath, JSON.stringify(slots, null, 2), "utf8");
    await rename(tempPath, filePath);
    return { ok: true, projectId, slots };
  } catch {
    return { ok: false, status: 500, reason: "store-write-failed", projectId, slots: [] };
  }
}

export async function upsertProjectWorkspaceSlot(options = {}) {
  const config = options.config || workspaceStoreConfig(options.env || process.env || {});
  if (!config.enabled) return { ok: false, status: 503, reason: config.reason, projectId: "", slots: [] };

  const slot = sanitizeWorkspaceSlot(options.slot);
  if (!slot) return { ok: false, status: 400, reason: "invalid-workspace-slot", projectId: normalizeWorkspaceProjectId(options.projectId), slots: [] };

  const current = await readProjectWorkspaceSlots({ config, projectId: options.projectId });
  if (!current.ok) return current;
  return writeProjectWorkspaceSlots({
    config,
    projectId: current.projectId,
    slots: upsertWorkspaceSlot(current.slots, slot),
  });
}

export async function removeProjectWorkspaceSlot(options = {}) {
  const config = options.config || workspaceStoreConfig(options.env || process.env || {});
  if (!config.enabled) return { ok: false, status: 503, reason: config.reason, projectId: "", slots: [] };

  const slotId = cleanOneLine(options.slotId, 120);
  if (!slotId) return { ok: false, status: 400, reason: "invalid-slot-id", projectId: normalizeWorkspaceProjectId(options.projectId), slots: [] };

  const current = await readProjectWorkspaceSlots({ config, projectId: options.projectId });
  if (!current.ok) return current;
  return writeProjectWorkspaceSlots({
    config,
    projectId: current.projectId,
    slots: removeWorkspaceSlot(current.slots, slotId),
  });
}
