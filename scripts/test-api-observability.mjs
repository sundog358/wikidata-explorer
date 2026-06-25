import assert from "node:assert/strict";
import {
  API_FAILURE_CATEGORIES,
  API_OBSERVABILITY_ALERT_RULES,
  API_OBSERVABILITY_RECEIVER_EVENT_LIMIT,
  apiObservabilityReceiverConfig,
  apiObservabilityReceiverSnapshot,
  apiObservabilityMonitorConfig,
  apiObservabilityMonitorPayload,
  apiObservabilityDashboardSpec,
  apiFailureEvent,
  authorizeApiObservabilityReceiver,
  classifyApiFailure,
  evaluateApiFailureAlerts,
  logApiFailure,
  receiveApiObservabilityMonitorPayload,
  reportApiFailure,
  sanitizeLogMessage,
  sendApiFailureToMonitor,
} from "../lib/api-observability.mjs";
import { AI_DISABLED_MESSAGE } from "../lib/ai-feature-flags.mjs";

assert.equal(classifyApiFailure({ status: 404, message: AI_DISABLED_MESSAGE }), API_FAILURE_CATEGORIES.AG2_DISABLED);
assert.equal(classifyApiFailure({ status: 503, message: "OpenAI API key is not configured for the AG2 agent." }), API_FAILURE_CATEGORIES.OPENAI_KEY_MISSING);
assert.equal(classifyApiFailure({ status: 429, message: "The OpenAI API is rate limited or out of quota." }), API_FAILURE_CATEGORIES.OPENAI_QUOTA_OR_RATE_LIMIT);
assert.equal(classifyApiFailure({ status: 502, message: "The AG2 response did not include required Wikidata grounding references." }), API_FAILURE_CATEGORIES.AG2_GROUNDING_INVALID);
assert.equal(classifyApiFailure({ status: 429, message: "AI agent request rate limited." }), API_FAILURE_CATEGORIES.REQUEST_RATE_LIMITED);
assert.equal(classifyApiFailure({ status: 502, message: "Could not reach AG2 service: connection refused" }), API_FAILURE_CATEGORIES.AG2_SERVICE_UNAVAILABLE);
assert.equal(classifyApiFailure({ status: 503, message: "Fixture Wikidata outage" }), API_FAILURE_CATEGORIES.WIKIDATA_UNAVAILABLE);
assert.equal(classifyApiFailure({ status: 503, message: "Commons media metadata could not be loaded" }), API_FAILURE_CATEGORIES.COMMONS_UNAVAILABLE);
assert.equal(classifyApiFailure({ status: 403, message: "Autonomy safety policy blocked this workflow." }), API_FAILURE_CATEGORIES.SAFETY_POLICY);
assert.equal(classifyApiFailure({ status: 400, message: "Invalid chat request." }), API_FAILURE_CATEGORIES.REQUEST_VALIDATION);

const redacted = sanitizeLogMessage("OpenAI key sk-proj-secret123456 and Authorization=Bearer abcdefghijklmnop token=very-secret");
assert.doesNotMatch(redacted, /sk-proj-secret/);
assert.doesNotMatch(redacted, /abcdefghijklmnop/);
assert.doesNotMatch(redacted, /very-secret/);
assert.match(redacted, /<redacted>/);

const event = apiFailureEvent({
  route: "/api/chat?prompt=hidden",
  status: 503,
  error: new Error("Could not reach AG2 service with token=secret-token-value"),
});
assert.equal(event.route, "unknown");
assert.equal(event.category, API_FAILURE_CATEGORIES.AG2_SERVICE_UNAVAILABLE);
assert.equal(event.status, 503);
assert.doesNotMatch(JSON.stringify(event), /secret-token-value/);

const logs = [];
const logged = logApiFailure(
  {
    route: "/api/ag2-workflow",
    status: 400,
    message: "Invalid AG2 workflow request with user prompt that should not be logged.",
  },
  { warn: (...args) => logs.push(args.join(" ")) },
);
assert.equal(logged.category, API_FAILURE_CATEGORIES.REQUEST_VALIDATION);
assert.equal(logged.route, "/api/ag2-workflow");
assert.equal(logs.length, 1);
assert.match(logs[0], /"event":"api_failure"/);
assert.doesNotMatch(logs[0], /messages|statements|OPENAI_API_KEY/);

assert.deepEqual(apiObservabilityMonitorConfig({}), { enabled: false, reason: "not-configured" });
assert.deepEqual(apiObservabilityMonitorConfig({ API_OBSERVABILITY_WEBHOOK_URL: "not a url" }), { enabled: false, reason: "invalid-url" });
assert.deepEqual(apiObservabilityMonitorConfig({ API_OBSERVABILITY_WEBHOOK_URL: "http://monitor.example.com/events" }), { enabled: false, reason: "insecure-url" });
assert.equal(apiObservabilityMonitorConfig({ API_OBSERVABILITY_WEBHOOK_URL: "https://monitor.example.com/events" }).enabled, true);
assert.equal(apiObservabilityMonitorConfig({ API_OBSERVABILITY_WEBHOOK_URL: "http://127.0.0.1:3002/events" }).enabled, true);
assert.deepEqual(apiObservabilityReceiverConfig({}), { enabled: false, reason: "token-not-configured" });
assert.deepEqual(apiObservabilityReceiverConfig({ API_OBSERVABILITY_RECEIVER_TOKEN: "short" }), { enabled: false, reason: "token-too-short" });
assert.equal(apiObservabilityReceiverConfig({ API_OBSERVABILITY_RECEIVER_TOKEN: "receiver-token-value" }).enabled, true);
assert.equal(apiObservabilityReceiverConfig({ API_OBSERVABILITY_WEBHOOK_TOKEN: "monitor-token-value" }).enabled, true);
assert.deepEqual(
  authorizeApiObservabilityReceiver({ authorization: "Bearer wrong-token" }, { API_OBSERVABILITY_RECEIVER_TOKEN: "receiver-token-value" }),
  { authorized: false, status: 401, reason: "unauthorized" },
);
assert.deepEqual(
  authorizeApiObservabilityReceiver({ authorization: "Bearer receiver-token-value" }, { API_OBSERVABILITY_RECEIVER_TOKEN: "receiver-token-value" }),
  { authorized: true },
);

const monitorPayload = apiObservabilityMonitorPayload({
  route: "/api/chat",
  status: 502,
  message: "The AG2 response did not include required Wikidata grounding references. Bearer abcdefghijklmnop",
});
assert.equal(monitorPayload.source, "wikidata-explorer");
assert.equal(monitorPayload.event.category, API_FAILURE_CATEGORIES.AG2_GROUNDING_INVALID);
assert.equal(monitorPayload.alertRules[0].id, "ag2-grounding-invalid");
assert.doesNotMatch(JSON.stringify(monitorPayload), /abcdefghijklmnop/);

const receiverStore = [];
const receivedMonitor = receiveApiObservabilityMonitorPayload(monitorPayload, {
  store: receiverStore,
  now: "2026-06-25T21:29:45.000Z",
});
assert.equal(receivedMonitor.received, true);
assert.equal(receivedMonitor.event.category, API_FAILURE_CATEGORIES.AG2_GROUNDING_INVALID);
assert.equal(receivedMonitor.retainedEvents, 1);
assert.equal(receivedMonitor.alertResults.find((alert) => alert.id === "ag2-grounding-invalid").firing, true);
assert.doesNotMatch(JSON.stringify(receiverStore), /abcdefghijklmnop/);

for (let index = 0; index < API_OBSERVABILITY_RECEIVER_EVENT_LIMIT + 3; index += 1) {
  receiveApiObservabilityMonitorPayload({
    event: {
      route: "/api/chat",
      status: 503,
      category: API_FAILURE_CATEGORIES.AG2_SERVICE_UNAVAILABLE,
      message: `AG2 service unavailable ${index}`,
      createdAt: "2026-06-25T21:29:50.000Z",
    },
  }, { store: receiverStore });
}
assert.equal(receiverStore.length, API_OBSERVABILITY_RECEIVER_EVENT_LIMIT);
const receiverSnapshot = apiObservabilityReceiverSnapshot({
  store: receiverStore,
  now: "2026-06-25T21:30:00.000Z",
});
assert.equal(receiverSnapshot.dashboard.title, "Wikidata Explorer API Reliability");
assert.equal(receiverSnapshot.retainedEvents, API_OBSERVABILITY_RECEIVER_EVENT_LIMIT);
assert.equal(receiverSnapshot.recentEvents.length, 25);
assert.equal(receiverSnapshot.alertResults.find((alert) => alert.id === "ag2-service-unavailable-spike").firing, true);

const disabledMonitor = await sendApiFailureToMonitor(monitorPayload.event, { env: {} });
assert.deepEqual(disabledMonitor, { sent: false, reason: "not-configured" });

const fetchCalls = [];
const sentMonitor = await sendApiFailureToMonitor(monitorPayload.event, {
  env: {
    API_OBSERVABILITY_WEBHOOK_URL: "https://monitor.example.com/events",
    API_OBSERVABILITY_WEBHOOK_TOKEN: "monitor-token-value",
  },
  fetchImpl: async (url, init) => {
    fetchCalls.push({ url, init });
    return { ok: true, status: 202 };
  },
});
assert.deepEqual(sentMonitor, { sent: true, status: 202 });
assert.equal(fetchCalls[0].url, "https://monitor.example.com/events");
assert.equal(fetchCalls[0].init.method, "POST");
assert.equal(fetchCalls[0].init.headers.authorization, "Bearer monitor-token-value");
const sentBody = JSON.parse(fetchCalls[0].init.body);
assert.equal(sentBody.event.category, API_FAILURE_CATEGORIES.AG2_GROUNDING_INVALID);
assert.equal(sentBody.alertRules[0].severity, "critical");

const reportLogs = [];
const reported = await reportApiFailure({
  route: "/api/chat",
  status: 502,
  message: "The AG2 response did not include required Wikidata grounding references.",
}, {
  env: { API_OBSERVABILITY_WEBHOOK_URL: "https://monitor.example.com/events" },
  fetchImpl: async () => ({ ok: true, status: 202 }),
  logger: { warn: (message) => reportLogs.push(message) },
});
assert.equal(reported.category, API_FAILURE_CATEGORIES.AG2_GROUNDING_INVALID);
assert.equal(reportLogs.length, 1);

const categoriesWithAlerts = new Set(API_OBSERVABILITY_ALERT_RULES.map((rule) => rule.category));
assert.deepEqual(categoriesWithAlerts, new Set(Object.values(API_FAILURE_CATEGORIES)));
assert.equal(API_OBSERVABILITY_ALERT_RULES.every((rule) => /^[a-z0-9-]+$/.test(rule.id)), true);
assert.equal(API_OBSERVABILITY_ALERT_RULES.every((rule) => ["critical", "warning", "info"].includes(rule.severity)), true);
assert.equal(API_OBSERVABILITY_ALERT_RULES.every((rule) => rule.windowMinutes > 0 && rule.threshold > 0), true);
assert.equal(API_OBSERVABILITY_ALERT_RULES.every((rule) => !/sk-|Bearer\s+|secret=/i.test(rule.runbook)), true);

const dashboard = apiObservabilityDashboardSpec();
assert.equal(dashboard.title, "Wikidata Explorer API Reliability");
assert.equal(dashboard.eventName, "api_failure");
assert.ok(dashboard.panels.some((panel) => panel.id === "failure-count-by-category" && panel.groupBy === "category"));
dashboard.title = "mutated";
assert.equal(apiObservabilityDashboardSpec().title, "Wikidata Explorer API Reliability");

const now = "2026-06-25T21:30:00.000Z";
const alertResults = evaluateApiFailureAlerts([
  { event: "api_failure", category: API_FAILURE_CATEGORIES.AG2_SERVICE_UNAVAILABLE, createdAt: "2026-06-25T21:29:00.000Z" },
  { event: "api_failure", category: API_FAILURE_CATEGORIES.AG2_SERVICE_UNAVAILABLE, createdAt: "2026-06-25T21:28:00.000Z" },
  { event: "api_failure", category: API_FAILURE_CATEGORIES.AG2_SERVICE_UNAVAILABLE, createdAt: "2026-06-25T21:27:00.000Z" },
  { event: "api_failure", category: API_FAILURE_CATEGORIES.AG2_SERVICE_UNAVAILABLE, createdAt: "2026-06-25T21:10:00.000Z" },
  { event: "api_failure", category: API_FAILURE_CATEGORIES.AG2_GROUNDING_INVALID, createdAt: "2026-06-25T21:29:45.000Z" },
  { event: "api_failure", category: API_FAILURE_CATEGORIES.OPENAI_KEY_MISSING, createdAt: "2026-06-25T21:29:30.000Z" },
  { event: "other_event", category: API_FAILURE_CATEGORIES.UNKNOWN, createdAt: "2026-06-25T21:29:30.000Z" },
], { now });
const ag2Alert = alertResults.find((alert) => alert.id === "ag2-service-unavailable-spike");
assert.equal(ag2Alert.count, 3);
assert.equal(ag2Alert.firing, true);
const openAiKeyAlert = alertResults.find((alert) => alert.id === "openai-key-missing");
assert.equal(openAiKeyAlert.count, 1);
assert.equal(openAiKeyAlert.firing, true);
const groundingAlert = alertResults.find((alert) => alert.id === "ag2-grounding-invalid");
assert.equal(groundingAlert.count, 1);
assert.equal(groundingAlert.firing, true);
const unknownAlert = alertResults.find((alert) => alert.id === "unknown-api-failures");
assert.equal(unknownAlert.count, 0);
assert.equal(unknownAlert.firing, false);

console.log("PASS API observability tests");
