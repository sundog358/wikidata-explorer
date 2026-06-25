const WORKSPACE_ARTIFACT_TYPE = "wikidata-explorer-workspace";
const WORKSPACE_VERSION = 1;
const WORKSPACE_SLOT_COLLECTION_LIMIT = 12;

export const WORKSPACE_REVIEW_TASK_STATUSES = Object.freeze([
  "needs_review",
  "checking_sources",
  "ready_to_draft",
  "resolved",
]);

const AGENT_ACTIONS = new Set(["research", "graph", "suggest", "verify", "compare", "report"]);
const REVIEW_STATUSES = new Set(WORKSPACE_REVIEW_TASK_STATUSES);
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{8,}/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  /(api[_-]?key|token|secret)\s*[:=]\s*["']?[^"',\s]+/gi,
];

function cleanOneLine(value, maxLength = 300) {
  return String(value ?? "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanBlock(value, maxLength = 6000) {
  return redactSecrets(String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maxLength));
}

function redactSecrets(value) {
  return SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, "[redacted]"), String(value ?? ""));
}

function validEntityId(value) {
  return /^[QP]\d+$/.test(cleanOneLine(value, 32).toUpperCase());
}

function normalizeEntityId(value) {
  const id = cleanOneLine(value, 32).toUpperCase();
  return validEntityId(id) ? id : "";
}

function validIsoDate(value) {
  const timestamp = Date.parse(cleanOneLine(value, 80));
  return Number.isFinite(timestamp);
}

function formatDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function sanitizeSafety(safety) {
  if (!safety || typeof safety !== "object") return undefined;
  return {
    decisionLabel: cleanOneLine(safety.decisionLabel, 120),
    risk: cleanOneLine(safety.risk, 60),
    modeLabel: cleanOneLine(safety.modeLabel, 120),
    reasons: Array.isArray(safety.reasons) ? safety.reasons.slice(0, 4).map((reason) => cleanOneLine(reason, 240)).filter(Boolean) : [],
    requiredControls: Array.isArray(safety.requiredControls) ? safety.requiredControls.slice(0, 6).map((control) => cleanOneLine(control, 120)).filter(Boolean) : [],
  };
}

function sanitizeGraphFocus(focus) {
  if (!focus || typeof focus !== "object") return undefined;
  const id = normalizeEntityId(focus.id);
  const propertyId = cleanOneLine(focus.propertyId, 20).toUpperCase();
  if (!id || !/^P\d+$/.test(propertyId)) return undefined;

  return {
    id,
    label: cleanOneLine(focus.label || id, 160),
    property: cleanOneLine(focus.property || propertyId, 160),
    propertyId,
    kind: focus.kind === "property" ? "property" : "item",
    rank: ["deprecated", "normal", "preferred"].includes(focus.rank) ? focus.rank : "normal",
    dataType: focus.dataType ? cleanOneLine(focus.dataType, 80) : null,
    qualifierCount: Math.min(999, Math.max(0, Number.parseInt(String(focus.qualifierCount || 0), 10) || 0)),
    referenceCount: Math.min(999, Math.max(0, Number.parseInt(String(focus.referenceCount || 0), 10) || 0)),
    statementId: focus.statementId ? cleanOneLine(focus.statementId, 200) : null,
    value: cleanOneLine(focus.value || focus.label || id, 400),
  };
}

export function sanitizeWorkspaceReviewTaskStatuses(statuses = {}) {
  if (!statuses || typeof statuses !== "object" || Array.isArray(statuses)) return {};

  return Object.fromEntries(
    Object.entries(statuses)
      .filter(([id, status]) => cleanOneLine(id, 320) && typeof status === "string" && REVIEW_STATUSES.has(status))
      .slice(-300)
      .map(([id, status]) => [cleanOneLine(id, 320), status]),
  );
}

export function sanitizeWorkspaceDismissedReviewIds(ids = []) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map((id) => cleanOneLine(id, 320)).filter(Boolean))].slice(-250);
}

export function sanitizeWorkspaceAgentRuns(runs = []) {
  if (!Array.isArray(runs)) return [];

  return runs.slice(0, 40).map((run) => {
    const entityId = normalizeEntityId(run?.entityId);
    const action = cleanOneLine(run?.action, 40);
    if (!entityId || !AGENT_ACTIONS.has(action)) return null;

    const compareEntityId = normalizeEntityId(run?.compareEntityId);
    const safety = sanitizeSafety(run?.safety);
    const graphFocus = sanitizeGraphFocus(run?.graphFocus);

    return {
      id: cleanOneLine(run?.id || `${entityId}-${action}-${run?.createdAt || "snapshot"}`, 160),
      entityId,
      entityLabel: cleanOneLine(run?.entityLabel || entityId, 160),
      action,
      title: cleanOneLine(run?.title || `${action} agent run`, 160),
      result: cleanBlock(run?.result, 6000),
      ...(safety ? { safety } : {}),
      ...(compareEntityId ? { compareEntityId } : {}),
      ...(graphFocus ? { graphFocus } : {}),
      createdAt: validIsoDate(run?.createdAt) ? cleanOneLine(run.createdAt, 80) : formatDate(),
    };
  }).filter(Boolean);
}

export function buildWorkspaceSnapshot(input = {}) {
  const entityId = normalizeEntityId(input.entityId);
  const entityLabel = cleanOneLine(input.entityLabel || entityId || "Selected entity", 160);
  const createdAt = formatDate(input.createdAt);

  return {
    artifactType: WORKSPACE_ARTIFACT_TYPE,
    version: WORKSPACE_VERSION,
    createdAt,
    entity: {
      id: entityId,
      label: entityLabel,
    },
    review: {
      taskStatuses: sanitizeWorkspaceReviewTaskStatuses(input.reviewTaskStatuses),
      dismissedIds: sanitizeWorkspaceDismissedReviewIds(input.dismissedReviewIds),
    },
    agentRuns: sanitizeWorkspaceAgentRuns(input.savedAgentRuns),
  };
}

export function sanitizeWorkspaceSlot(slot = {}) {
  if (!slot || typeof slot !== "object" || Array.isArray(slot)) return null;
  const parsed = parseWorkspaceSnapshot(slot.snapshot || slot.workspace || slot);
  if (!parsed.ok || !parsed.snapshot) return null;

  const snapshot = parsed.snapshot;
  const id = cleanOneLine(slot.id || `workspace-${snapshot.entity.id}`, 120);
  if (!id) return null;

  const label = cleanOneLine(slot.label || snapshot.entity.label || snapshot.entity.id, 160);
  const createdAt = validIsoDate(slot.createdAt) ? cleanOneLine(slot.createdAt, 80) : snapshot.createdAt;
  const updatedAt = validIsoDate(slot.updatedAt) ? cleanOneLine(slot.updatedAt, 80) : formatDate();

  return {
    id,
    label,
    entityId: snapshot.entity.id,
    entityLabel: snapshot.entity.label,
    createdAt,
    updatedAt,
    snapshot,
  };
}

export function readWorkspaceSlotCollection(value) {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];
  return parsed
    .map(sanitizeWorkspaceSlot)
    .filter(Boolean)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, WORKSPACE_SLOT_COLLECTION_LIMIT);
}

export function upsertWorkspaceSlot(slots = [], slotInput = {}) {
  const nextSlot = sanitizeWorkspaceSlot(slotInput);
  if (!nextSlot) return readWorkspaceSlotCollection(slots);

  return [
    nextSlot,
    ...readWorkspaceSlotCollection(slots).filter((slot) => slot.id !== nextSlot.id),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, WORKSPACE_SLOT_COLLECTION_LIMIT);
}

export function removeWorkspaceSlot(slots = [], slotId = "") {
  const id = cleanOneLine(slotId, 120);
  return readWorkspaceSlotCollection(slots).filter((slot) => slot.id !== id);
}

export function parseWorkspaceSnapshot(value) {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return { ok: false, error: "Workspace snapshot is not valid JSON.", snapshot: null };
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Workspace snapshot must be a JSON object.", snapshot: null };
  }

  if (parsed.artifactType !== WORKSPACE_ARTIFACT_TYPE || parsed.version !== WORKSPACE_VERSION) {
    return { ok: false, error: "Workspace snapshot type or version is not supported.", snapshot: null };
  }

  const entityId = normalizeEntityId(parsed.entity?.id);
  if (!entityId) {
    return { ok: false, error: "Workspace snapshot is missing a valid Wikidata entity ID.", snapshot: null };
  }

  return {
    ok: true,
    error: null,
    snapshot: buildWorkspaceSnapshot({
      createdAt: parsed.createdAt,
      entityId,
      entityLabel: parsed.entity?.label || entityId,
      reviewTaskStatuses: parsed.review?.taskStatuses,
      dismissedReviewIds: parsed.review?.dismissedIds,
      savedAgentRuns: parsed.agentRuns,
    }),
  };
}
