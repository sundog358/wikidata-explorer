import { AI_DISABLED_MESSAGE } from "./ai-feature-flags.mjs";

export const API_FAILURE_CATEGORIES = Object.freeze({
  AG2_DISABLED: "ag2-disabled",
  AG2_GROUNDING_INVALID: "ag2-grounding-invalid",
  AG2_SERVICE_UNAVAILABLE: "ag2-service-unavailable",
  COMMONS_UNAVAILABLE: "commons-unavailable",
  OPENAI_KEY_MISSING: "openai-key-missing",
  OPENAI_QUOTA_OR_RATE_LIMIT: "openai-quota-rate-limit",
  REQUEST_RATE_LIMITED: "request-rate-limited",
  REQUEST_VALIDATION: "request-validation",
  SAFETY_POLICY: "safety-policy",
  UNKNOWN: "unknown",
  WIKIDATA_UNAVAILABLE: "wikidata-unavailable",
});

export const API_OBSERVABILITY_ALERT_RULES = Object.freeze([
  {
    id: "ag2-service-unavailable-spike",
    category: API_FAILURE_CATEGORIES.AG2_SERVICE_UNAVAILABLE,
    severity: "critical",
    windowMinutes: 5,
    threshold: 3,
    runbook: "Check AG2_SERVICE_URL reachability, AG2_SERVICE_TOKEN alignment, and container health before enabling AI demo traffic.",
  },
  {
    id: "ag2-grounding-invalid",
    category: API_FAILURE_CATEGORIES.AG2_GROUNDING_INVALID,
    severity: "critical",
    windowMinutes: 10,
    threshold: 1,
    runbook: "Disable the AI demo route, inspect the AG2 prompt/response contract, and require Grounding references with supplied Wikidata IDs before restoring traffic.",
  },
  {
    id: "openai-key-missing",
    category: API_FAILURE_CATEGORIES.OPENAI_KEY_MISSING,
    severity: "critical",
    windowMinutes: 15,
    threshold: 1,
    runbook: "Confirm provider credentials are present only in the server/container environment and redeploy the affected runtime.",
  },
  {
    id: "openai-quota-rate-limit",
    category: API_FAILURE_CATEGORIES.OPENAI_QUOTA_OR_RATE_LIMIT,
    severity: "warning",
    windowMinutes: 15,
    threshold: 2,
    runbook: "Inspect OpenAI project quota/rate limits and keep the public AI feature flag disabled if capacity is exhausted.",
  },
  {
    id: "request-rate-limited-spike",
    category: API_FAILURE_CATEGORIES.REQUEST_RATE_LIMITED,
    severity: "warning",
    windowMinutes: 5,
    threshold: 10,
    runbook: "Review public AI route throttling, abusive traffic patterns, and whether rate-limit copy remains clear to users.",
  },
  {
    id: "wikidata-unavailable-spike",
    category: API_FAILURE_CATEGORIES.WIKIDATA_UNAVAILABLE,
    severity: "warning",
    windowMinutes: 10,
    threshold: 5,
    runbook: "Check Wikidata Action/API availability and keep fixture-backed search/e2e coverage green while live data recovers.",
  },
  {
    id: "commons-unavailable-spike",
    category: API_FAILURE_CATEGORIES.COMMONS_UNAVAILABLE,
    severity: "warning",
    windowMinutes: 10,
    threshold: 5,
    runbook: "Check Commons metadata availability; the search workbench should remain usable with media fallback copy.",
  },
  {
    id: "request-validation-spike",
    category: API_FAILURE_CATEGORIES.REQUEST_VALIDATION,
    severity: "warning",
    windowMinutes: 10,
    threshold: 20,
    runbook: "Inspect API contract drift, malformed client requests, and recent route payload changes.",
  },
  {
    id: "safety-policy-blocks",
    category: API_FAILURE_CATEGORIES.SAFETY_POLICY,
    severity: "info",
    windowMinutes: 15,
    threshold: 5,
    runbook: "Review blocked workflow intent; safety policy blocks are expected but should remain explainable and non-sensitive.",
  },
  {
    id: "ag2-disabled-public-traffic",
    category: API_FAILURE_CATEGORIES.AG2_DISABLED,
    severity: "info",
    windowMinutes: 30,
    threshold: 10,
    runbook: "Public AI-off mode should fail closed; investigate only if disabled responses exceed normal demo exploration.",
  },
  {
    id: "unknown-api-failures",
    category: API_FAILURE_CATEGORIES.UNKNOWN,
    severity: "warning",
    windowMinutes: 10,
    threshold: 1,
    runbook: "Classify the failure, add a category-specific test, and ensure no prompts, tokens, or raw payloads are logged.",
  },
]);

export const API_OBSERVABILITY_DASHBOARD_SPEC = Object.freeze({
  title: "Wikidata Explorer API Reliability",
  eventName: "api_failure",
  panels: Object.freeze([
    { id: "failure-count-by-category", title: "API failures by category", groupBy: "category" },
    { id: "failure-count-by-route", title: "API failures by route", groupBy: "route" },
    { id: "failure-status-codes", title: "API failure status codes", groupBy: "status" },
    { id: "critical-ai-runtime-alerts", title: "Critical AI runtime alerts", categories: Object.freeze([API_FAILURE_CATEGORIES.AG2_SERVICE_UNAVAILABLE, API_FAILURE_CATEGORIES.AG2_GROUNDING_INVALID, API_FAILURE_CATEGORIES.OPENAI_KEY_MISSING]) },
    { id: "upstream-data-alerts", title: "Upstream data availability", categories: Object.freeze([API_FAILURE_CATEGORIES.WIKIDATA_UNAVAILABLE, API_FAILURE_CATEGORIES.COMMONS_UNAVAILABLE]) },
    { id: "public-mode-safety-alerts", title: "Public-mode safety and disabled responses", categories: Object.freeze([API_FAILURE_CATEGORIES.AG2_DISABLED, API_FAILURE_CATEGORIES.SAFETY_POLICY, API_FAILURE_CATEGORIES.REQUEST_RATE_LIMITED]) },
  ]),
  alerts: API_OBSERVABILITY_ALERT_RULES,
});

export const API_OBSERVABILITY_RECEIVER_EVENT_LIMIT = 200;
const API_OBSERVABILITY_RECEIVER_STORE_KEY = "__wikidataExplorerApiObservabilityEvents";

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{8,}/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  /(api[_-]?key|token|authorization)=([^&\s]+)/gi,
];

function cleanOneLine(value = "") {
  return String(value)
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeLogMessage(value, maxLength = 220) {
  let message = cleanOneLine(value);
  for (const pattern of SECRET_PATTERNS) {
    message = message.replace(pattern, (match, key) => (key ? `${key}=<redacted>` : "<redacted>"));
  }
  return message.length > maxLength ? `${message.slice(0, maxLength - 1)}…` : message;
}

function errorMessage(error) {
  if (typeof error === "string") return error;
  if (error && typeof error.message === "string") return error.message;
  return "";
}

export function classifyApiFailure(input = {}) {
  if (input.category && Object.values(API_FAILURE_CATEGORIES).includes(input.category)) {
    return input.category;
  }

  const status = Number(input.status || input.error?.status || 0);
  const message = cleanOneLine(input.message || errorMessage(input.error)).toLowerCase();

  if (message.includes(AI_DISABLED_MESSAGE.toLowerCase())) return API_FAILURE_CATEGORIES.AG2_DISABLED;
  if (/openai api key|api key is not configured|openai key/.test(message)) return API_FAILURE_CATEGORIES.OPENAI_KEY_MISSING;
  if (/quota|out of quota|openai.*rate limit|rate limited by openai/.test(message)) return API_FAILURE_CATEGORIES.OPENAI_QUOTA_OR_RATE_LIMIT;
  if (/grounding references|grounding invalid|wikidata grounding|did not include required wikidata/.test(message)) return API_FAILURE_CATEGORIES.AG2_GROUNDING_INVALID;
  if (status === 429 && /agent|request|rate/.test(message)) return API_FAILURE_CATEGORIES.REQUEST_RATE_LIMITED;
  if (/wikidata/.test(message) || input.route === "wikidata") return API_FAILURE_CATEGORIES.WIKIDATA_UNAVAILABLE;
  if (/commons/.test(message) || input.route === "commons") return API_FAILURE_CATEGORIES.COMMONS_UNAVAILABLE;
  if (/autonomy safety|safety policy/.test(message) || status === 403) return API_FAILURE_CATEGORIES.SAFETY_POLICY;
  if (status === 400 || /invalid .*request|valid json|required/.test(message)) return API_FAILURE_CATEGORIES.REQUEST_VALIDATION;
  if (/ag2 service|ag2 workflow|ag2 chat|entity summary service|could not reach ag2|service unavailable|service url|service token/.test(message) || [502, 503, 504].includes(status)) {
    return API_FAILURE_CATEGORIES.AG2_SERVICE_UNAVAILABLE;
  }

  return API_FAILURE_CATEGORIES.UNKNOWN;
}

function safeRoute(route) {
  const value = cleanOneLine(route || "");
  if (/^\/api\/[a-z0-9-]+$/i.test(value)) return value;
  if (/^(wikidata|commons)$/i.test(value)) return value.toLowerCase();
  return "unknown";
}

export function apiFailureEvent(input = {}) {
  const status = Number(input.status || input.error?.status || 500);
  const message = sanitizeLogMessage(input.message || errorMessage(input.error) || "API route failed.");
  const errorName = typeof input.error?.name === "string" ? sanitizeLogMessage(input.error.name, 80) : undefined;

  return {
    event: "api_failure",
    route: safeRoute(input.route),
    category: classifyApiFailure({ ...input, status, message }),
    status,
    ...(errorName ? { errorName } : {}),
    message,
  };
}

export function logApiFailure(input = {}, logger = console) {
  const event = apiFailureEvent(input);
  const log = typeof logger.warn === "function" ? logger.warn.bind(logger) : console.warn.bind(console);
  log("[wikidata-explorer]", JSON.stringify(event));
  return event;
}

function isLocalhostUrl(url) {
  return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
}

export function apiObservabilityMonitorConfig(env = {}) {
  const rawUrl = cleanOneLine(env.API_OBSERVABILITY_WEBHOOK_URL || "");
  if (!rawUrl) return { enabled: false, reason: "not-configured" };

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { enabled: false, reason: "invalid-url" };
  }

  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalhostUrl(url))) {
    return { enabled: false, reason: "insecure-url" };
  }

  return {
    enabled: true,
    url: url.toString(),
    token: cleanOneLine(env.API_OBSERVABILITY_WEBHOOK_TOKEN || ""),
  };
}

export function apiObservabilityMonitorPayload(event) {
  const sanitizedEvent = apiFailureEvent(event);
  const alertRules = API_OBSERVABILITY_ALERT_RULES
    .filter((rule) => rule.category === sanitizedEvent.category)
    .map((rule) => ({
      id: rule.id,
      category: rule.category,
      severity: rule.severity,
      windowMinutes: rule.windowMinutes,
      threshold: rule.threshold,
      runbook: rule.runbook,
    }));

  return {
    source: "wikidata-explorer",
    eventName: "api_failure",
    event: sanitizedEvent,
    alertRules,
  };
}

function boundedReceiverEvents(events) {
  return events
    .filter((event) => event?.event === "api_failure")
    .slice(-API_OBSERVABILITY_RECEIVER_EVENT_LIMIT);
}

function receiverEventStore() {
  const root = globalThis;
  if (!Array.isArray(root[API_OBSERVABILITY_RECEIVER_STORE_KEY])) {
    root[API_OBSERVABILITY_RECEIVER_STORE_KEY] = [];
  }
  return root[API_OBSERVABILITY_RECEIVER_STORE_KEY];
}

export function apiObservabilityReceiverConfig(env = {}) {
  const token = cleanOneLine(env.API_OBSERVABILITY_RECEIVER_TOKEN || env.API_OBSERVABILITY_WEBHOOK_TOKEN || "");
  if (!token) return { enabled: false, reason: "token-not-configured" };
  if (token.length < 16) return { enabled: false, reason: "token-too-short" };
  return { enabled: true, token };
}

export function authorizeApiObservabilityReceiver(headers = {}, env = {}) {
  const config = apiObservabilityReceiverConfig(env);
  if (!config.enabled) return { authorized: false, status: 503, reason: config.reason };

  const headerValue = typeof headers.get === "function"
    ? headers.get("authorization")
    : headers.authorization || headers.Authorization || "";
  const expected = `Bearer ${config.token}`;
  if (String(headerValue || "") !== expected) {
    return { authorized: false, status: 401, reason: "unauthorized" };
  }

  return { authorized: true };
}

export function receiveApiObservabilityMonitorPayload(payload = {}, options = {}) {
  const eventInput = payload?.event || payload;
  const event = apiFailureEvent({
    route: eventInput.route,
    status: eventInput.status,
    category: eventInput.category,
    message: eventInput.message || "Received API failure event.",
    error: eventInput.errorName ? { name: eventInput.errorName, message: eventInput.message } : undefined,
  });
  const createdAt = cleanOneLine(eventInput.createdAt || eventInput.timestamp || options.now || new Date().toISOString());
  const storedEvent = { ...event, createdAt };
  const store = options.store || receiverEventStore();
  store.push(storedEvent);
  const bounded = boundedReceiverEvents(store);
  store.splice(0, store.length, ...bounded);

  return {
    received: true,
    event: storedEvent,
    alertResults: evaluateApiFailureAlerts(store, { now: createdAt }),
    retainedEvents: store.length,
  };
}

export function apiObservabilityReceiverSnapshot(options = {}) {
  const store = options.store || receiverEventStore();
  const now = options.now || new Date().toISOString();
  return {
    dashboard: apiObservabilityDashboardSpec(),
    alertResults: evaluateApiFailureAlerts(store, { now }),
    recentEvents: boundedReceiverEvents(store).slice(-25).reverse(),
    retainedEvents: store.length,
  };
}

export async function sendApiFailureToMonitor(event, options = {}) {
  const env = options.env || process.env || {};
  const config = options.config || apiObservabilityMonitorConfig(env);
  if (!config.enabled) return { sent: false, reason: config.reason || "not-configured" };

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") return { sent: false, reason: "fetch-unavailable" };

  const payload = apiObservabilityMonitorPayload(event);
  const headers = {
    "content-type": "application/json",
    "user-agent": "wikidata-explorer-observability",
    ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
  };
  const timeoutMs = Math.max(100, Math.min(5000, Number.parseInt(String(options.timeoutMs || 1200), 10) || 1200));
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetchImpl(config.url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      ...(controller ? { signal: controller.signal } : {}),
    });
    return { sent: response.ok, status: response.status };
  } catch (error) {
    return { sent: false, reason: error?.name === "AbortError" ? "timeout" : "request-failed" };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function reportApiFailure(input = {}, options = {}) {
  const event = logApiFailure(input, options.logger || console);
  const result = await sendApiFailureToMonitor(event, options);
  if (!result.sent && result.reason && result.reason !== "not-configured") {
    const logger = options.logger || console;
    const warn = typeof logger.warn === "function" ? logger.warn.bind(logger) : console.warn.bind(console);
    warn("[wikidata-explorer]", JSON.stringify({
      event: "api_failure_monitor_delivery_failed",
      reason: sanitizeLogMessage(result.reason, 80),
      status: result.status,
    }));
  }
  return event;
}

function eventTimeMs(event, fallbackNow) {
  const createdAt = event?.createdAt || event?.timestamp || event?.time;
  const parsed = createdAt ? Date.parse(createdAt) : NaN;
  return Number.isFinite(parsed) ? parsed : fallbackNow;
}

export function evaluateApiFailureAlerts(events = [], options = {}) {
  const nowMs = Date.parse(options.now || "") || Date.now();
  const rules = options.rules || API_OBSERVABILITY_ALERT_RULES;
  const apiFailureEvents = events.filter((event) => event?.event === "api_failure");

  return rules.map((rule) => {
    const windowStartMs = nowMs - (rule.windowMinutes * 60 * 1000);
    const matches = apiFailureEvents.filter((event) =>
      event.category === rule.category &&
      eventTimeMs(event, nowMs) >= windowStartMs &&
      eventTimeMs(event, nowMs) <= nowMs
    );

    return {
      id: rule.id,
      category: rule.category,
      severity: rule.severity,
      windowMinutes: rule.windowMinutes,
      threshold: rule.threshold,
      count: matches.length,
      firing: matches.length >= rule.threshold,
      runbook: rule.runbook,
    };
  });
}

export function apiObservabilityDashboardSpec() {
  return JSON.parse(JSON.stringify(API_OBSERVABILITY_DASHBOARD_SPEC));
}
