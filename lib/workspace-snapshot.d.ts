export const WORKSPACE_REVIEW_TASK_STATUSES: readonly ["needs_review", "checking_sources", "ready_to_draft", "resolved"];

export type WorkspaceReviewTaskStatus = typeof WORKSPACE_REVIEW_TASK_STATUSES[number];

export type WorkspaceSnapshot = {
  artifactType: "wikidata-explorer-workspace";
  version: 1;
  createdAt: string;
  entity: {
    id: string;
    label: string;
  };
  review: {
    taskStatuses: Record<string, WorkspaceReviewTaskStatus>;
    dismissedIds: string[];
  };
  agentRuns: unknown[];
};

export type WorkspaceSlot = {
  id: string;
  label: string;
  entityId: string;
  entityLabel: string;
  createdAt: string;
  updatedAt: string;
  snapshot: WorkspaceSnapshot;
};

export function sanitizeWorkspaceReviewTaskStatuses(statuses?: unknown): Record<string, WorkspaceReviewTaskStatus>;
export function sanitizeWorkspaceDismissedReviewIds(ids?: unknown): string[];
export function sanitizeWorkspaceAgentRuns(runs?: unknown): unknown[];
export function buildWorkspaceSnapshot(input?: {
  entityId?: string;
  entityLabel?: string;
  reviewTaskStatuses?: unknown;
  dismissedReviewIds?: unknown;
  savedAgentRuns?: unknown;
  createdAt?: string | Date;
}): WorkspaceSnapshot;
export function parseWorkspaceSnapshot(value: unknown): {
  ok: boolean;
  error: string | null;
  snapshot: WorkspaceSnapshot | null;
};
export function sanitizeWorkspaceSlot(slot?: unknown): WorkspaceSlot | null;
export function readWorkspaceSlotCollection(value: unknown): WorkspaceSlot[];
export function upsertWorkspaceSlot(slots?: unknown, slotInput?: unknown): WorkspaceSlot[];
export function removeWorkspaceSlot(slots?: unknown, slotId?: string): WorkspaceSlot[];
