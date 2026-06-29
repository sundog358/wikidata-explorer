import assert from "node:assert/strict";
import {
  hostedAg2ProofConfig,
  runHostedAg2Proof,
} from "../lib/ag2-hosted-proof.mjs";

const strongToken = "hosted-ag2-proof-token-value-32-plus";
const receiverToken = "hosted-observability-token";
const baseEnv = {
  AG2_DEMO_BASE_URL: "https://demo.example.com",
  NEXT_PUBLIC_SITE_URL: "https://demo.example.com",
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
  AG2_SERVICE_URL: "https://agents.example.com",
  AG2_SERVICE_TOKEN: strongToken,
  AI_AGENT_RATE_LIMIT_MAX: "20",
  AI_AGENT_RATE_LIMIT_WINDOW_MS: "60000",
  AG2_ENABLE_DOCS: "false",
  API_OBSERVABILITY_WEBHOOK_URL: "https://demo.example.com/api/observability/events",
  API_OBSERVABILITY_WEBHOOK_TOKEN: receiverToken,
  AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN: receiverToken,
  AG2_DEMO_REQUIRE_DURABLE_OBSERVABILITY: "true",
};

const missingConfig = hostedAg2ProofConfig({});
assert.equal(missingConfig.ok, false);
assert.match(missingConfig.errors.join(" "), /AG2_DEMO_BASE_URL/);

const noObservability = hostedAg2ProofConfig({
  ...baseEnv,
  AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN: "",
  API_OBSERVABILITY_WEBHOOK_TOKEN: "",
});
assert.equal(noObservability.ok, false);
assert.match(noObservability.errors.join(" "), /OBSERVABILITY_RECEIVER_TOKEN/);

const observabilityOptional = hostedAg2ProofConfig({
  ...baseEnv,
  AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN: "",
  API_OBSERVABILITY_WEBHOOK_TOKEN: "",
  AG2_DEMO_REQUIRE_OBSERVABILITY: "false",
});
assert.equal(observabilityOptional.ok, true);

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function createFetchMock(options = {}) {
  const requests = [];
  let delivered = false;
  const fetchImpl = async (urlInput, init = {}) => {
    const url = new URL(String(urlInput));
    const method = init.method || "GET";
    const authorization = init.headers?.authorization || init.headers?.Authorization || "";
    const body = init.body ? JSON.parse(init.body) : null;
    requests.push({ url: url.toString(), pathname: url.pathname, method, authorization, body });

    if (url.toString() === "https://agents.example.com/health") {
      return response(options.healthStatus || 200, { ok: options.healthOk !== false });
    }

    if (url.origin !== "https://demo.example.com") {
      return response(404, { error: "unexpected host" });
    }

    if (url.pathname === "/api/entity-summary" && method === "POST") {
      if (options.aiDisabled) return response(404, { error: "AI agents are disabled for this deployment." });
      if (options.ungrounded) {
        return response(200, { summary: "Ungrounded hosted response", grounding: { ok: false, matchedIds: [] } });
      }
      return response(200, {
        summary: "Hosted AG2 summary for Douglas Adams (Q42).\n\nGrounding references\n- Wikidata IDs: Q42, P31",
        grounding: { ok: true, matchedIds: ["Q42", "P31"], requiredIds: ["Q42"] },
      });
    }

    if (url.pathname === "/api/observability/events" && method === "GET") {
      if (authorization !== `Bearer ${receiverToken}`) return response(401, { error: "unauthorized" });
      return response(200, {
        dashboard: { title: "Wikidata Explorer API Reliability" },
        storage: { durable: options.notDurable ? false : true },
        retainedEvents: delivered ? 1 : 0,
        recentEvents: delivered ? [{
          event: "api_failure",
          route: "/api/ag2-workflow",
          status: 400,
          category: "request-validation",
          message: "Invalid AG2 workflow request.",
          createdAt: new Date().toISOString(),
        }] : [],
      });
    }

    if (url.pathname === "/api/ag2-workflow" && method === "POST") {
      delivered = true;
      return response(400, { error: "Invalid AG2 workflow request." });
    }

    return response(404, { error: "not found" });
  };
  return { fetchImpl, requests };
}

const successMock = createFetchMock();
const success = await runHostedAg2Proof({ env: baseEnv, fetchImpl: successMock.fetchImpl });
assert.equal(success.ok, true);
assert.equal(success.appBaseUrl, "https://demo.example.com");
assert.equal(success.ag2ServiceUrl, "https://agents.example.com");
assert.deepEqual(success.checks.map((check) => check.id), ["ag2-demo-readiness", "grounded-entity-summary", "observability-delivery"]);
assert.ok(success.checks.find((check) => check.id === "grounded-entity-summary")?.matchedIds.includes("Q42"));
assert.ok(successMock.requests.some((request) => request.url === "https://agents.example.com/health"));
assert.ok(successMock.requests.some((request) => request.pathname === "/api/entity-summary" && request.body.entity.id === "Q42"));
assert.ok(successMock.requests.some((request) => request.pathname === "/api/ag2-workflow" && request.body.action === "delete"));
assert.ok(successMock.requests.some((request) => request.pathname === "/api/observability/events" && request.authorization === `Bearer ${receiverToken}`));
assert.doesNotMatch(JSON.stringify(success), new RegExp(strongToken));
assert.doesNotMatch(JSON.stringify(success), new RegExp(receiverToken));

const aiDisabled = await runHostedAg2Proof({ env: baseEnv, fetchImpl: createFetchMock({ aiDisabled: true }).fetchImpl });
assert.equal(aiDisabled.ok, false);
assert.match(aiDisabled.errors.join(" "), /ENABLE_AI_AGENTS=true/);

const ungrounded = await runHostedAg2Proof({ env: baseEnv, fetchImpl: createFetchMock({ ungrounded: true }).fetchImpl });
assert.equal(ungrounded.ok, false);
assert.match(ungrounded.errors.join(" "), /grounded Q42 evidence/);

const notDurable = await runHostedAg2Proof({ env: baseEnv, fetchImpl: createFetchMock({ notDurable: true }).fetchImpl });
assert.equal(notDurable.ok, false);
assert.match(notDurable.errors.join(" "), /durable storage/);

const noMonitorRequired = await runHostedAg2Proof({
  env: {
    ...baseEnv,
    AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN: "",
    API_OBSERVABILITY_WEBHOOK_TOKEN: "",
    AG2_DEMO_REQUIRE_OBSERVABILITY: "false",
  },
  fetchImpl: createFetchMock().fetchImpl,
});
assert.equal(noMonitorRequired.ok, true);
assert.equal(noMonitorRequired.checks.find((check) => check.id === "observability-delivery")?.skipped, true);

console.log("PASS hosted AG2 proof tests");
