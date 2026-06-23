const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export const AI_DISABLED_MESSAGE =
  "AI agents are disabled in this public deployment. Enable them locally or connect the AG2 service to use agent workflows.";

export function aiAgentsEnabled(env = {}) {
  const publicValue = String(env.NEXT_PUBLIC_ENABLE_AI_AGENTS || "").trim().toLowerCase();
  const serverValue = String(env.ENABLE_AI_AGENTS || "").trim().toLowerCase();
  return TRUE_VALUES.has(publicValue) || TRUE_VALUES.has(serverValue);
}
