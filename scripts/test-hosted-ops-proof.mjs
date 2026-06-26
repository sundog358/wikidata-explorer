import assert from "node:assert/strict";
import { hostedOpsProofConfig, runHostedOpsProof } from "../lib/hosted-ops-proof.mjs";

const env = {
  HOSTED_OPS_BASE_URL: "https://www.wikidataexplorer.com",
  WORKSPACE_STORE_TOKEN: "workspace-token-value",
  API_OBSERVABILITY_RECEIVER_TOKEN: "observability-token-value",
};

assert.equal(hostedOpsProofConfig({}).ok, false);
assert.match(hostedOpsProofConfig({}).errors.join(" "), /WORKSPACE_STORE_TOKEN/);
assert.equal(hostedOpsProofConfig({ HOSTED_OPS_BASE_URL: "http://example.com", WORKSPACE_STORE_TOKEN: "x", API_OBSERVABILITY_RECEIVER_TOKEN: "y" }).ok, false);
assert.equal(hostedOpsProofConfig(env).ok, true);

const requests = [];
const fetchImpl = async (url, init = {}) => {
  const parsed = new URL(url);
  const body = init.body ? JSON.parse(init.body) : null;
  requests.push({
    method: init.method || "GET",
    path: `${parsed.pathname}${parsed.search}`,
    authorization: init.headers?.authorization,
    body,
  });

  const json = (status, value) => ({ status, ok: status >= 200 && status < 300, json: async () => value });

  if (parsed.pathname === "/api/workspaces" && !init.headers?.authorization) {
    return json(401, { error: "unauthorized" });
  }
  if (parsed.pathname === "/api/workspaces" && init.method === "POST") {
    assert.equal(init.headers.authorization, "Bearer workspace-token-value");
    assert.equal(body.accountId.startsWith("ops-proof-account-"), true);
    assert.equal(body.slot.snapshot.entity.id, "Q42");
    return json(202, {
      accountId: body.accountId,
      projectId: body.projectId,
      slots: [{ id: body.slot.id, entityId: "Q42" }],
      taskSummary: { total: 1 },
      agentSummary: { total: 1 },
    });
  }
  if (parsed.pathname === "/api/workspaces" && init.method === "DELETE") {
    assert.equal(init.headers.authorization, "Bearer workspace-token-value");
    return json(200, { accountId: body.accountId, projectId: body.projectId, slots: [] });
  }
  if (parsed.pathname === "/api/workspaces") {
    assert.equal(init.headers.authorization, "Bearer workspace-token-value");
    return json(200, { slots: [{ id: "ops-proof-slot-20260625223500", entityId: "Q42" }] });
  }

  if (parsed.pathname === "/api/observability/events" && !init.headers?.authorization) {
    return json(401, { error: "unauthorized" });
  }
  if (parsed.pathname === "/api/observability/events" && init.method === "POST") {
    assert.equal(init.headers.authorization, "Bearer observability-token-value");
    return json(202, {
      received: true,
      category: "ag2-grounding-invalid",
      storage: { durable: true },
      firingAlerts: [{ id: "ag2-grounding-invalid" }],
    });
  }
  if (parsed.pathname === "/api/observability/events") {
    assert.equal(init.headers.authorization, "Bearer observability-token-value");
    return json(200, {
      dashboard: { title: "Wikidata Explorer API Reliability" },
      storage: { durable: true },
      retainedEvents: 1,
      recentEvents: [],
    });
  }

  return json(404, { error: "not found" });
};

const result = await runHostedOpsProof({
  env,
  fetchImpl,
  now: "2026-06-25T22:35:00.000Z",
  ids: {
    accountId: "ops-proof-account-20260625223500",
    projectId: "ops-proof-project-20260625223500",
    slotId: "ops-proof-slot-20260625223500",
  },
});
assert.equal(result.ok, true);
assert.equal(result.checks.length, 2);
assert.ok(requests.some((request) => request.method === "DELETE" && request.path === "/api/workspaces"));
assert.doesNotMatch(JSON.stringify(result), /workspace-token-value|observability-token-value|hosted-proof-secret-token/);

const nonDurable = await runHostedOpsProof({
  env,
  ids: { accountId: "a", projectId: "p", slotId: "s" },
  fetchImpl: async (url, init = {}) => {
    const parsed = new URL(url);
    const body = init.body ? JSON.parse(init.body) : {};
    if (parsed.pathname === "/api/workspaces" && !init.headers?.authorization) return { status: 401, ok: false, json: async () => ({}) };
    if (parsed.pathname === "/api/workspaces" && init.method === "POST") return { status: 202, ok: true, json: async () => ({ accountId: body.accountId, projectId: body.projectId, slots: [{ id: body.slot.id }], taskSummary: { total: 1 }, agentSummary: { total: 1 } }) };
    if (parsed.pathname === "/api/workspaces" && init.method === "DELETE") return { status: 200, ok: true, json: async () => ({}) };
    if (parsed.pathname === "/api/workspaces") return { status: 200, ok: true, json: async () => ({ slots: [{ id: "s" }] }) };
    if (parsed.pathname === "/api/observability/events" && !init.headers?.authorization) return { status: 401, ok: false, json: async () => ({}) };
    if (parsed.pathname === "/api/observability/events" && init.method === "POST") return { status: 202, ok: true, json: async () => ({ category: "ag2-grounding-invalid", storage: { durable: false }, firingAlerts: [{ id: "ag2-grounding-invalid" }] }) };
    return { status: 200, ok: true, json: async () => ({ dashboard: { title: "Wikidata Explorer API Reliability" }, storage: { durable: false } }) };
  },
});
assert.equal(nonDurable.ok, false);
assert.match(nonDurable.errors.join(" "), /requires durable storage/);

console.log("PASS hosted ops proof tests");
