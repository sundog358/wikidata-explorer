import { aiAgentsEnabled } from "./ai-feature-flags.mjs";
import { validateAg2ServiceToken } from "./ag2-service-auth.mjs";

const LOCAL_SERVICE_URL_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i;
const LOCAL_SITE_URL_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i;

function envValue(env, key) {
  return String(env[key] || "").trim();
}

function hasValue(env, key) {
  return envValue(env, key).length > 0;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalServiceUrl(value) {
  return LOCAL_SERVICE_URL_PATTERN.test(value);
}

function isLocalSiteUrl(value) {
  return LOCAL_SITE_URL_PATTERN.test(value);
}

function isValidSiteUrl(value) {
  return isHttpsUrl(value) || isLocalSiteUrl(value);
}

export function validateDeployEnv(env = {}, options = {}) {
  const mode = options.mode || "public-vercel";
  const errors = [];
  const warnings = [];
  const publicAiEnabled = aiAgentsEnabled({
    NEXT_PUBLIC_ENABLE_AI_AGENTS: env.NEXT_PUBLIC_ENABLE_AI_AGENTS,
  });
  const serverAiEnabled = aiAgentsEnabled({
    ENABLE_AI_AGENTS: env.ENABLE_AI_AGENTS,
  });
  const ag2ServiceUrl = envValue(env, "AG2_SERVICE_URL");
  const siteUrl = envValue(env, "NEXT_PUBLIC_SITE_URL");
  const vercelUrl = envValue(env, "VERCEL_URL");
  const explicitObservabilityReceiverToken = envValue(env, "API_OBSERVABILITY_RECEIVER_TOKEN");
  const observabilityReceiverToken = explicitObservabilityReceiverToken || envValue(env, "API_OBSERVABILITY_WEBHOOK_TOKEN");
  const observabilityStoreDir = envValue(env, "API_OBSERVABILITY_STORE_DIR");

  if (mode !== "public-vercel" && mode !== "ai-container") {
    errors.push(`Unknown deploy mode ${JSON.stringify(mode)}. Use public-vercel or ai-container.`);
  }

  if (siteUrl && !isValidSiteUrl(siteUrl)) {
    errors.push("NEXT_PUBLIC_SITE_URL must be HTTPS in production, or localhost for local metadata checks.");
  }

  if (!siteUrl) {
    warnings.push(vercelUrl
      ? "NEXT_PUBLIC_SITE_URL is not set; metadata will fall back to the Vercel-provided URL."
      : "Set NEXT_PUBLIC_SITE_URL to the deployed app URL so metadata, robots, and sitemap do not default to localhost.");
  }

  if (mode === "public-vercel") {
    if (publicAiEnabled) errors.push("Public Vercel deploy must set NEXT_PUBLIC_ENABLE_AI_AGENTS=false or leave it unset.");
    if (serverAiEnabled) errors.push("Public Vercel deploy must set ENABLE_AI_AGENTS=false or leave it unset.");
    if (ag2ServiceUrl) warnings.push("AG2_SERVICE_URL is ignored while AI agents are disabled.");
    if (hasValue(env, "OPENAI_API_KEY")) warnings.push("OPENAI_API_KEY is not needed for the public AI-off Vercel deploy.");
  }

  if (mode === "ai-container") {
    if (!publicAiEnabled) errors.push("AI container deploy must set NEXT_PUBLIC_ENABLE_AI_AGENTS=true.");
    if (!serverAiEnabled) errors.push("AI container deploy must set ENABLE_AI_AGENTS=true.");
    if (!ag2ServiceUrl) {
      errors.push("AI container deploy requires AG2_SERVICE_URL.");
    } else if (!isHttpsUrl(ag2ServiceUrl) && !isLocalServiceUrl(ag2ServiceUrl)) {
      errors.push("AG2_SERVICE_URL must be HTTPS in production, or localhost for local testing.");
    }

    const token = validateAg2ServiceToken(env);
    if (!token.ok) errors.push(token.error);

    if (!hasValue(env, "AI_AGENT_RATE_LIMIT_MAX")) warnings.push("Set AI_AGENT_RATE_LIMIT_MAX for public AI-enabled deployments.");
    if (!hasValue(env, "AI_AGENT_RATE_LIMIT_WINDOW_MS")) warnings.push("Set AI_AGENT_RATE_LIMIT_WINDOW_MS for public AI-enabled deployments.");
    if (envValue(env, "AG2_ENABLE_DOCS").toLowerCase() === "true") warnings.push("Keep AG2_ENABLE_DOCS=false for production.");
  }

  if (publicAiEnabled !== serverAiEnabled) {
    errors.push("NEXT_PUBLIC_ENABLE_AI_AGENTS and ENABLE_AI_AGENTS must be enabled or disabled together for production deploys.");
  }

  if (observabilityStoreDir && !observabilityReceiverToken) {
    warnings.push("API_OBSERVABILITY_STORE_DIR is ignored until API_OBSERVABILITY_RECEIVER_TOKEN or API_OBSERVABILITY_WEBHOOK_TOKEN is configured.");
  }

  if (explicitObservabilityReceiverToken && !observabilityStoreDir) {
    warnings.push("The built-in observability receiver will use in-memory retention; set API_OBSERVABILITY_STORE_DIR to keep monitor events across restarts.");
  }

  return {
    ok: errors.length === 0,
    mode,
    errors,
    warnings,
  };
}
