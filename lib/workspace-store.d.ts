import type { WorkspaceSlot } from "./workspace-snapshot.mjs";

export type WorkspaceStoreConfig =
  | { enabled: false; reason: string }
  | { enabled: true; rootDir: string; token: string };

export interface WorkspaceStoreResult {
  ok: boolean;
  status?: number;
  reason?: string;
  projectId: string;
  slots: WorkspaceSlot[];
}

export interface ProjectWorkspaceCurationTask {
  id: string;
  entityId: string;
  propertyId: string;
  propertyLabel: string;
  statementId: string;
  severity: "medium" | "high";
  status: "needs_review" | "checking_sources" | "ready_to_draft" | "resolved";
  title: string;
  detail: string;
  value: string;
  sourceHints: WorkspaceSlot["snapshot"]["review"]["curationTasks"][number]["sourceHints"];
  workspaceSlotId: string;
  workspaceSlotLabel: string;
  workspaceEntityId: string;
  workspaceEntityLabel: string;
  workspaceUpdatedAt: string;
}

export interface ProjectWorkspaceCurationTaskSummary {
  total: number;
  open: number;
  entities: number;
  properties: number;
  workspaces: number;
  statusCounts: Record<"needs_review" | "checking_sources" | "ready_to_draft" | "resolved", number>;
  severityCounts: Record<"high" | "medium", number>;
}

export function normalizeWorkspaceProjectId(value?: unknown): string;
export function workspaceStoreConfig(env?: Record<string, string | undefined>): WorkspaceStoreConfig;
export function authorizeWorkspaceStore(headers?: Headers | Record<string, string | undefined>, env?: Record<string, string | undefined>):
  | { authorized: false; status: number; reason?: string }
  | { authorized: true; config: Extract<WorkspaceStoreConfig, { enabled: true }> };
export function buildProjectWorkspaceCurationTaskIndex(slots?: unknown): ProjectWorkspaceCurationTask[];
export function summarizeProjectWorkspaceCurationTasks(slots?: unknown): ProjectWorkspaceCurationTaskSummary;
export function readProjectWorkspaceSlots(options?: { env?: Record<string, string | undefined>; config?: Extract<WorkspaceStoreConfig, { enabled: true }>; projectId?: unknown }): Promise<WorkspaceStoreResult>;
export function writeProjectWorkspaceSlots(options?: { env?: Record<string, string | undefined>; config?: Extract<WorkspaceStoreConfig, { enabled: true }>; projectId?: unknown; slots?: unknown }): Promise<WorkspaceStoreResult>;
export function upsertProjectWorkspaceSlot(options?: { env?: Record<string, string | undefined>; config?: Extract<WorkspaceStoreConfig, { enabled: true }>; projectId?: unknown; slot?: unknown }): Promise<WorkspaceStoreResult>;
export function removeProjectWorkspaceSlot(options?: { env?: Record<string, string | undefined>; config?: Extract<WorkspaceStoreConfig, { enabled: true }>; projectId?: unknown; slotId?: unknown }): Promise<WorkspaceStoreResult>;
