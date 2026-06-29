import { ag2DemoReadinessReport } from "./ag2-demo-readiness.mjs";

const DEFAULT_TIMEOUT_MS = 8000;

function cleanOneLine(value = "", maxLength = 500) {
  return String(value ?? "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanBaseUrl(value = "") {
  const raw = cleanOneLine(value);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function boolEnv(value, defaultValue = true) {
  const raw = cleanOneLine(value).toLowerCase();
  if (!raw) return defaultValue;
  return !["0", "false", "no", "off"].includes(raw);
}

function authorizationHeader(token) {
  return { authorization: `Bearer ${token}` };
}

async function fetchWithTimeout(fetchImpl, url, init = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    return await fetchImpl(url, {
      ...init,
      ...(controller ? { signal: controller.signal } : {}),
    });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function jsonResponse(response) {
  return response.json().catch(() => ({}));
}

async function getJson(fetchImpl, baseUrl, route, headers = {}, timeoutMs) {
  const response = await fetchWithTimeout(fetchImpl, new URL(route, baseUrl), { headers }, timeoutMs);
  return { response, body: await jsonResponse(response) };
}

async function postJson(fetchImpl, baseUrl, route, body, headers = {}, timeoutMs) {
  const response = await fetchWithTimeout(fetchImpl, new URL(route, baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  }, timeoutMs);
  return { response, body: await jsonResponse(response) };
}

const fixtureEntity = Object.freeze({
  id: "Q42",
  type: "item",
  label: "Douglas Adams",
  description: "English author and humorist",
  statements: Object.freeze([
    Object.freeze({
      propertyId: "P31",
      propertyLabel: "instance of",
      rank: "normal",
      value: "human",
      qualifiers: Object.freeze([]),
      references: Object.freeze([
        Object.freeze({
          hash: "hosted-proof-reference",
          parts: Object.freeze([
            Object.freeze({
              propertyId: "P248",
              propertyLabel: "stated in",
              value: "Integrated Authority File",
            }),
          ]),
        }),
      ]),
    }),
  ]),
});

export function hostedAg2ProofConfig(env = {}) {
  const appBaseUrl = cleanBaseUrl(env.AG2_DEMO_BASE_URL || env.AI_DEMO_BASE_URL || "");
  const ag2ServiceUrl = cleanBaseUrl(env.AG2_SERVICE_URL || "");
  const observabilityToken = cleanOneLine(env.AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN || env.API_OBSERVABILITY_RECEIVER_TOKEN || env.API_OBSERVABILITY_WEBHOOK_TOKEN || "");
  const requireObservability = boolEnv(env.AG2_DEMO_REQUIRE_OBSERVABILITY, true);
  const requireDurableObservability = boolEnv(env.AG2_DEMO_REQUIRE_DURABLE_OBSERVABILITY, true);
  const timeoutMs = Math.max(1000, Math.min(30000, Number.parseInt(String(env.AG2_DEMO_PROOF_TIMEOUT_MS || DEFAULT_TIMEOUT_MS), 10) || DEFAULT_TIMEOUT_MS));

  return {
    ok: Boolean(appBaseUrl && (!requireObservability || observabilityToken)),
    appBaseUrl,
    ag2ServiceUrl,
    observabilityToken,
    requireObservability,
    requireDurableObservability,
    timeoutMs,
    errors: [
      ...(appBaseUrl ? [] : ["AG2_DEMO_BASE_URL or AI_DEMO_BASE_URL is required and must be HTTPS, localhost, or 127.0.0.1."]),
      ...(!requireObservability || observabilityToken ? [] : ["AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN or API_OBSERVABILITY_RECEIVER_TOKEN is required for hosted monitor delivery proof."]),
    ],
  };
}

async function proveGroundedEntitySummary(config, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const result = await postJson(fetchImpl, config.appBaseUrl, "/api/entity-summary", { entity: fixtureEntity }, {}, config.timeoutMs);
  const text = JSON.stringify(result.body);

  if (result.response.status === 404) {
    throw new Error("AI demo route returned 404; confirm the hosted app has ENABLE_AI_AGENTS=true.");
  }
  if (result.response.status !== 200) {
    throw new Error(`entity summary proof expected 200, got ${result.response.status} ${text}`);
  }
  if (result.body.grounding?.ok !== true || !Array.isArray(result.body.grounding?.matchedIds) || !result.body.grounding.matchedIds.includes("Q42")) {
    throw new Error(`entity summary proof did not return grounded Q42 evidence: ${text}`);
  }
  if (!/\bGrounding references\b/i.test(String(result.body.summary || ""))) {
    throw new Error("entity summary proof response is missing a Grounding references section.");
  }

  return {
    ok: true,
    route: "/api/entity-summary",
    matchedIds: result.body.grounding.matchedIds,
  };
}

async function proveMonitorDelivery(config, options = {}) {
  if (!config.requireObservability) return { ok: true, skipped: true, reason: "observability proof disabled" };

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const auth = authorizationHeader(config.observabilityToken);
  const before = await getJson(fetchImpl, config.appBaseUrl, "/api/observability/events", auth, config.timeoutMs);
  if (before.response.status !== 200) {
    throw new Error(`observability receiver proof expected authenticated snapshot 200, got ${before.response.status} ${JSON.stringify(before.body)}`);
  }
  if (config.requireDurableObservability && before.body.storage?.durable !== true) {
    throw new Error("observability receiver proof requires durable storage, but the hosted receiver snapshot is not durable.");
  }

  const createdAt = new Date().toISOString();
  const invalid = await postJson(fetchImpl, config.appBaseUrl, "/api/ag2-workflow", {
    action: "delete",
    entityId: "Q42",
  }, {}, config.timeoutMs);
  if (![400, 403].includes(invalid.response.status)) {
    throw new Error(`observability proof expected a validation or safety failure, got ${invalid.response.status} ${JSON.stringify(invalid.body)}`);
  }

  const deadline = Date.now() + config.timeoutMs;
  let lastSnapshot = null;
  while (Date.now() < deadline) {
    const snapshot = await getJson(fetchImpl, config.appBaseUrl, "/api/observability/events", auth, config.timeoutMs);
    lastSnapshot = snapshot;
    if (snapshot.response.status === 200) {
      const recentEvents = Array.isArray(snapshot.body.recentEvents) ? snapshot.body.recentEvents : [];
      const delivered = recentEvents.some((event) => {
        const eventTime = Date.parse(event.createdAt || event.timestamp || "");
        const proofTime = Date.parse(createdAt);
        return event.route === "/api/ag2-workflow" &&
          ["request-validation", "safety-policy"].includes(event.category) &&
          (!Number.isFinite(eventTime) || !Number.isFinite(proofTime) || eventTime >= proofTime - 5000);
      });
      if (delivered) {
        return {
          ok: true,
          route: "/api/observability/events",
          durable: snapshot.body.storage?.durable === true,
          retainedEvents: snapshot.body.retainedEvents,
        };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`observability receiver did not expose the induced AG2 workflow failure: ${JSON.stringify(lastSnapshot?.body || {})}`);
}

export async function runHostedAg2Proof(options = {}) {
  const env = options.env || process.env || {};
  const config = options.config || hostedAg2ProofConfig(env);
  if (!config.ok) return { ok: false, appBaseUrl: config.appBaseUrl, ag2ServiceUrl: config.ag2ServiceUrl, checks: [], errors: config.errors };

  const checks = [];
  try {
    const readiness = await ag2DemoReadinessReport(env, {
      health: true,
      fetchImpl: options.fetchImpl,
      timeoutMs: Math.min(config.timeoutMs, 5000),
    });
    checks.push({ id: "ag2-demo-readiness", ok: readiness.ok, checks: readiness.checks });
    if (!readiness.ok) {
      throw new Error(`AG2 demo readiness failed: ${readiness.errors.join(" ")}`);
    }

    checks.push({ id: "grounded-entity-summary", ...(await proveGroundedEntitySummary(config, options)) });
    checks.push({ id: "observability-delivery", ...(await proveMonitorDelivery(config, options)) });

    return { ok: true, appBaseUrl: config.appBaseUrl, ag2ServiceUrl: config.ag2ServiceUrl, checks, errors: [] };
  } catch (error) {
    return {
      ok: false,
      appBaseUrl: config.appBaseUrl,
      ag2ServiceUrl: config.ag2ServiceUrl,
      checks,
      errors: [cleanOneLine(error?.message || error, 1000)],
    };
  }
}
