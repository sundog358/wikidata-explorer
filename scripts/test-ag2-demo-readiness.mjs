import assert from "node:assert/strict";
import {
  ag2DemoReadinessReport,
  ag2DemoReadinessStaticReport,
  checkAg2ServiceHealth,
} from "../lib/ag2-demo-readiness.mjs";

const strongToken = "ag2-demo-readiness-token-32-plus";
const baseEnv = {
  NEXT_PUBLIC_SITE_URL: "https://www.wikidataexplorer.com",
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
  AG2_SERVICE_URL: "https://agents.example.com",
  AG2_SERVICE_TOKEN: strongToken,
  AI_AGENT_RATE_LIMIT_MAX: "20",
  AI_AGENT_RATE_LIMIT_WINDOW_MS: "60000",
  AG2_ENABLE_DOCS: "false",
  API_OBSERVABILITY_WEBHOOK_URL: "https://monitor.example.com/events",
  API_OBSERVABILITY_WEBHOOK_TOKEN: "monitor-token-value",
};

const missingEnv = ag2DemoReadinessStaticReport({});
assert.equal(missingEnv.ok, false);
assert.match(missingEnv.errors.join(" "), /AG2_SERVICE_URL/);
assert.ok(missingEnv.requiredEvidence.includes("npm run api:contracts:ag2"));

const noMonitoring = ag2DemoReadinessStaticReport({
  ...baseEnv,
  API_OBSERVABILITY_WEBHOOK_URL: "",
  API_OBSERVABILITY_WEBHOOK_TOKEN: "",
});
assert.equal(noMonitoring.ok, false);
assert.match(noMonitoring.errors.join(" "), /API_OBSERVABILITY_WEBHOOK_URL/);

const receiverWithoutStore = ag2DemoReadinessStaticReport({
  ...baseEnv,
  API_OBSERVABILITY_WEBHOOK_URL: "",
  API_OBSERVABILITY_WEBHOOK_TOKEN: "",
  API_OBSERVABILITY_RECEIVER_TOKEN: "receiver-token-value",
});
assert.equal(receiverWithoutStore.ok, false);
assert.match(receiverWithoutStore.errors.join(" "), /API_OBSERVABILITY_STORE_DIR/);

const receiverWithStore = ag2DemoReadinessStaticReport({
  ...baseEnv,
  API_OBSERVABILITY_WEBHOOK_URL: "",
  API_OBSERVABILITY_WEBHOOK_TOKEN: "",
  API_OBSERVABILITY_RECEIVER_TOKEN: "receiver-token-value",
  API_OBSERVABILITY_STORE_DIR: "/mnt/wikidata-observability",
});
assert.equal(receiverWithStore.ok, true);

const docsEnabled = ag2DemoReadinessStaticReport({
  ...baseEnv,
  AG2_ENABLE_DOCS: "true",
});
assert.equal(docsEnabled.ok, false);
assert.match(docsEnabled.errors.join(" "), /AG2_ENABLE_DOCS=false/);

const badRateLimit = ag2DemoReadinessStaticReport({
  ...baseEnv,
  AI_AGENT_RATE_LIMIT_MAX: "",
});
assert.equal(badRateLimit.ok, false);
assert.match(badRateLimit.errors.join(" "), /AI_AGENT_RATE_LIMIT_MAX/);

const healthOk = await checkAg2ServiceHealth(baseEnv, {
  fetchImpl: async (url, init) => {
    assert.equal(url, "https://agents.example.com/health");
    assert.equal(init.method, "GET");
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  },
});
assert.equal(healthOk.ok, true);

const healthBad = await checkAg2ServiceHealth(baseEnv, {
  fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ ok: false }) }),
});
assert.equal(healthBad.ok, false);

const ready = await ag2DemoReadinessReport(baseEnv, {
  fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }),
});
assert.equal(ready.ok, true);
assert.ok(ready.checks.some((item) => item.id === "ag2-service-health" && item.ok));
assert.doesNotMatch(JSON.stringify(ready), /ag2-demo-readiness-token-32-plus/);

const healthFailure = await ag2DemoReadinessReport(baseEnv, {
  fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({ ok: false }) }),
});
assert.equal(healthFailure.ok, false);
assert.match(healthFailure.errors.join(" "), /HTTP 503/);

console.log("PASS AG2 demo readiness tests");
