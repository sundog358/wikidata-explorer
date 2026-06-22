export type AutonomyMode = "read_only" | "draft_only" | "supervised_bot" | "sandbox_bot";
export type AutonomyRisk = "low" | "medium" | "high" | "critical";

export type AutonomyDecision = {
  allowed: boolean;
  action: string;
  actionLabel?: string;
  mode: AutonomyMode | string;
  modeLabel: string;
  risk: AutonomyRisk;
  category: string;
  decisionLabel: "Allowed" | "Blocked";
  reasons: string[];
  requiredControls: string[];
  audit: {
    mode: string;
    entityId: string | null;
    compareEntityId: string | null;
    batchSize: number;
    dryRun: boolean;
    humanApproved: boolean;
    botApproved: boolean;
  };
};

export function evaluateAutonomyAction(input: {
  action: string;
  mode?: AutonomyMode | string;
  entityId?: string;
  compareEntityId?: string;
  batchSize?: number;
  dryRun?: boolean;
  humanApproved?: boolean;
  botApproved?: boolean;
}): AutonomyDecision;
