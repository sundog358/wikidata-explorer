import assert from "node:assert/strict";
import {
  API_FAILURE_CATEGORIES,
  apiFailureEvent,
  classifyApiFailure,
  logApiFailure,
  sanitizeLogMessage,
} from "../lib/api-observability.mjs";
import { AI_DISABLED_MESSAGE } from "../lib/ai-feature-flags.mjs";

assert.equal(classifyApiFailure({ status: 404, message: AI_DISABLED_MESSAGE }), API_FAILURE_CATEGORIES.AG2_DISABLED);
assert.equal(classifyApiFailure({ status: 503, message: "OpenAI API key is not configured for the AG2 agent." }), API_FAILURE_CATEGORIES.OPENAI_KEY_MISSING);
assert.equal(classifyApiFailure({ status: 429, message: "The OpenAI API is rate limited or out of quota." }), API_FAILURE_CATEGORIES.OPENAI_QUOTA_OR_RATE_LIMIT);
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

console.log("PASS API observability tests");
