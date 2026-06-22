const RISK_ORDER = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const AUTONOMY_MODES = {
  read_only: {
    label: "Read-only analysis",
    maxRisk: "low",
    allowExternalWrites: false,
    requireHumanApproval: false,
    requireBotApproval: false,
    requireDryRun: false,
    maxBatchSize: 100,
  },
  draft_only: {
    label: "Draft-only automation",
    maxRisk: "medium",
    allowExternalWrites: false,
    requireHumanApproval: false,
    requireBotApproval: false,
    requireDryRun: false,
    maxBatchSize: 250,
  },
  supervised_bot: {
    label: "Supervised bot",
    maxRisk: "high",
    allowExternalWrites: true,
    requireHumanApproval: true,
    requireBotApproval: true,
    requireDryRun: false,
    maxBatchSize: 25,
  },
  sandbox_bot: {
    label: "Sandbox bot",
    maxRisk: "high",
    allowExternalWrites: true,
    requireHumanApproval: false,
    requireBotApproval: false,
    requireDryRun: true,
    maxBatchSize: 50,
  },
};

export const AUTONOMY_ACTIONS = {
  research: {
    label: "Research Agent",
    risk: "low",
    category: "analysis",
    externalWrite: false,
    requiredControls: ["Uses Wikidata IDs", "Returns analysis only", "No external writes"],
  },
  graph: {
    label: "Graph Analyst Agent",
    risk: "low",
    category: "analysis",
    externalWrite: false,
    requiredControls: ["Uses visible entity context", "Returns traversal suggestions only", "No external writes"],
  },
  verify: {
    label: "Citation/Verifier Agent",
    risk: "low",
    category: "analysis",
    externalWrite: false,
    requiredControls: ["Checks ranks, qualifiers, and references", "Returns evidence notes only", "No external writes"],
  },
  compare: {
    label: "Comparison Agent",
    risk: "low",
    category: "analysis",
    externalWrite: false,
    requiredControls: ["Requires a comparison entity ID", "Returns comparison notes only", "No external writes"],
  },
  report: {
    label: "Report Agent",
    risk: "low",
    category: "analysis",
    externalWrite: false,
    requiredControls: ["Produces Markdown research notes", "No external writes"],
  },
  quickstatements_draft: {
    label: "QuickStatements Draft Export",
    risk: "medium",
    category: "draft",
    externalWrite: false,
    requiredControls: ["Human review queue", "Duplicate checks", "Source requirements"],
  },
  wikidata_write: {
    label: "Live Wikidata Write",
    risk: "high",
    category: "write",
    externalWrite: true,
    requiredControls: ["Approved bot task", "Human approval", "Rate limit", "Rollback log", "Source requirements"],
  },
  mass_edit: {
    label: "Mass Edit",
    risk: "critical",
    category: "write",
    externalWrite: true,
    requiredControls: ["Approved bot task", "Human approval", "Small batches", "Rollback plan", "Community-visible edit summary"],
  },
  entity_merge: {
    label: "Entity Merge",
    risk: "critical",
    category: "destructive",
    externalWrite: true,
    requiredControls: ["Human approval", "Conflict checks", "Rollback plan", "No autonomous execution"],
  },
};

function normalizeMode(mode) {
  return AUTONOMY_MODES[mode] ? mode : "read_only";
}

function normalizeAction(action) {
  return AUTONOMY_ACTIONS[action] ? action : null;
}

function buildAudit(input, mode) {
  return {
    mode,
    entityId: input.entityId || null,
    compareEntityId: input.compareEntityId || null,
    batchSize: Math.max(1, Number(input.batchSize || 1)),
    dryRun: input.dryRun !== false,
    humanApproved: input.humanApproved === true,
    botApproved: input.botApproved === true,
  };
}

export function evaluateAutonomyAction(input) {
  const actionKey = normalizeAction(input.action);
  const modeKey = normalizeMode(input.mode || "read_only");
  const mode = AUTONOMY_MODES[modeKey];
  const action = actionKey ? AUTONOMY_ACTIONS[actionKey] : null;
  const reasons = [];

  if (!action) {
    return {
      allowed: false,
      action: input.action,
      mode: modeKey,
      modeLabel: mode.label,
      risk: "critical",
      category: "unknown",
      decisionLabel: "Blocked",
      reasons: ["Unknown autonomy action."],
      requiredControls: ["Register this action in the autonomy safety policy before use."],
      audit: buildAudit(input, modeKey),
    };
  }

  if (RISK_ORDER[action.risk] > RISK_ORDER[mode.maxRisk]) {
    reasons.push(`${action.label} is ${action.risk} risk, above the ${mode.label} limit.`);
  }

  if (action.externalWrite && !mode.allowExternalWrites) {
    reasons.push(`${mode.label} does not allow external writes.`);
  }

  if (mode.requireHumanApproval && !input.humanApproved) {
    reasons.push("Human approval is required for this autonomy mode.");
  }

  if (mode.requireBotApproval && !input.botApproved) {
    reasons.push("Approved Wikidata bot task/account is required for this autonomy mode.");
  }

  if (mode.requireDryRun && !input.dryRun) {
    reasons.push("Sandbox bot mode requires dry-run execution.");
  }

  const batchSize = Math.max(1, Number(input.batchSize || 1));
  if (batchSize > mode.maxBatchSize) {
    reasons.push(`Batch size ${batchSize} exceeds ${mode.label} limit of ${mode.maxBatchSize}.`);
  }

  if (actionKey === "compare" && !input.compareEntityId) {
    reasons.push("Comparison actions require a second Wikidata entity ID.");
  }

  if ((action.externalWrite || action.risk !== "low") && !input.entityId) {
    reasons.push("Non-read-only actions require an explicit target entity ID.");
  }

  const allowed = reasons.length === 0;
  return {
    allowed,
    action: actionKey,
    actionLabel: action.label,
    mode: modeKey,
    modeLabel: mode.label,
    risk: action.risk,
    category: action.category,
    decisionLabel: allowed ? "Allowed" : "Blocked",
    reasons: allowed ? [`${action.label} is allowed under ${mode.label}.`] : reasons,
    requiredControls: action.requiredControls,
    audit: buildAudit(input, modeKey),
  };
}
