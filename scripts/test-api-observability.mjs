import assert from "node:assert/strict";
import {
  API_FAILURE_CATEGORIES,
  API_OBSERVABILITY_ALERT_RULES,
  apiObservabilityDashboardSpec,
  apiFailureEvent,
  classifyApiFailure,
  evaluateApiFailureAlerts,
  logApiFailure,
  sanitizeLogMessage,
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
