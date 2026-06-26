import { apiObservabilityMonitorConfig, apiObservabilityReceiverConfig } from "./api-observability.mjs";
import { ag2ServiceAuthorizationHeader } from "./ag2-service-auth.mjs";
import { ag2ServiceUrl } from "./ag2-remote-service.mjs";
import { validateDeployEnv } from "./deploy-env-validation.mjs";

function cleanOneLine(value = "", maxLength = 220) {
  return String(value ?? "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function positiveInteger(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function check(id, ok, message, severity = "error") {
  return { id, ok: Boolean(ok), severity, message };
}

function healthUrlFor(env = {}) {
  const baseUrl = ag2ServiceUrl(env);
  if (!baseUrl) return null;
  return new URL("health", baseUrl + "/").toString();
}

export async function checkAg2ServiceHealth(env = {}, options = {}) {
  const healthUrl = healthUrlFor(env);
  if (!healthUrl) return { ok: false, reason: "AG2_SERVICE_URL is not configured." };

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") return { ok: false, reason: "fetch is unavailable." };

  const timeoutMs = Math.max(100, Math.min(5000, Number.parseInt(String(options.timeoutMs || 1500), 10) || 1500));
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetchImpl(healthUrl, {
      method: "GET",
      headers: { "user-agent": "wikidata-explorer-ag2-demo-readiness" },
      ...(controller ? { signal: controller.signal } : {}),
    });
    const body = await response.json().catch(() => ({}));
    return {
      ok: response.ok && body?.ok === true,
      status: response.status,
      reason: response.ok ? "" : `AG2 health returned HTTP ${response.status}.`,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error?.name === "AbortError"
        ? "AG2 health check timed out."
        : `AG2 health check failed: ${cleanOneLine(error?.message || error)}`,
    };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function ag2DemoReadinessStaticReport(env = {}) {
  const checks = [];
  const deploy = validateDeployEnv(env, { mode: "ai-container" });

  checks.push(check(
    "deploy-env",
    deploy.ok,
    deploy.ok ? "AI container deploy environment passes baseline validation." : deploy.errors.join(" "),
  ));

  const authorization = ag2ServiceAuthorizationHeader(env);
  checks.push(check(
    "service-token",
    "header" in authorization,
    "header" in authorization ? "AG2_SERVICE_TOKEN is present and strong enough." : authorization.error,
  ));

  const rateLimitMax = positiveInteger(env.AI_AGENT_RATE_LIMIT_MAX);
  const rateLimitWindowMs = positiveInteger(env.AI_AGENT_RATE_LIMIT_WINDOW_MS);
  checks.push(check(
    "rate-limits",
    rateLimitMax > 0 && rateLimitWindowMs > 0,
    rateLimitMax > 0 && rateLimitWindowMs > 0
      ? "AI route rate limits are configured."
      : "AI demo readiness requires AI_AGENT_RATE_LIMIT_MAX and AI_AGENT_RATE_LIMIT_WINDOW_MS.",
  ));

  const docsDisabled = cleanOneLine(env.AG2_ENABLE_DOCS).toLowerCase() !== "true";
  checks.push(check(
    "service-docs-disabled",
    docsDisabled,
    docsDisabled ? "AG2 FastAPI docs are disabled for the demo service." : "Set AG2_ENABLE_DOCS=false before demo traffic.",
  ));

  const monitor = apiObservabilityMonitorConfig(env);
  const receiver = apiObservabilityReceiverConfig(env);
  const receiverStoreConfigured = Boolean(cleanOneLine(env.API_OBSERVABILITY_STORE_DIR, 500));
  const hasDurableMonitor = monitor.enabled || (receiver.enabled && receiverStoreConfigured);
  checks.push(check(
    "monitoring",
    hasDurableMonitor,
    hasDurableMonitor
      ? "AI demo monitoring is configured through a hosted webhook or durable built-in receiver."
      : "Configure API_OBSERVABILITY_WEBHOOK_URL or API_OBSERVABILITY_RECEIVER_TOKEN with API_OBSERVABILITY_STORE_DIR before demo traffic.",
  ));

  if (cleanOneLine(env.API_OBSERVABILITY_WEBHOOK_URL) && !monitor.enabled) {
    checks.push(check("monitor-webhook-url", false, `Observability webhook is not usable: ${monitor.reason || "unknown reason"}.`));
  }

  checks.push(check(
    "grounding-contract",
    true,
    "AI-enabled route contracts require Grounding references and supplied Wikidata IDs before responses are returned.",
    "info",
  ));

  const warnings = deploy.warnings;
  const errors = checks.filter((item) => item.severity === "error" && !item.ok).map((item) => item.message);

  return {
    ok: errors.length === 0,
    mode: "ai-container",
    checks,
    warnings,
    errors,
    requiredEvidence: [
      "npm run verify",
      "npm run api:contracts:ag2",
      "npm run ag2:demo:check -- --health",
    ],
  };
}

export async function ag2DemoReadinessReport(env = {}, options = {}) {
  const report = ag2DemoReadinessStaticReport(env);

  if (options.health === false) return report;

  const health = await checkAg2ServiceHealth(env, options);
  report.checks.push(check(
    "ag2-service-health",
    health.ok,
    health.ok ? "AG2 service /health is reachable." : health.reason,
  ));

  report.errors = report.checks
    .filter((item) => item.severity === "error" && !item.ok)
    .map((item) => item.message);
  report.ok = report.errors.length === 0;
  return report;
}
