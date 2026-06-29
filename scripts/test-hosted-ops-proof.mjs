import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
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
    const accountId = parsed.searchParams.get("accountId");
    if (accountId) {
      return json(200, {
        accountId,
        projectId: parsed.searchParams.get("project"),
        slots: [{ id: "ops-proof-slot-20260625223500", entityId: "Q42" }],
        taskSummary: { total: 1 },
        agentSummary: { total: 1 },
      });
    }
    return json(200, {
      projectId: parsed.searchParams.get("project"),
      slots: [{ id: "flat-project-slot", entityId: "Q80" }],
      taskSummary: { total: 0 },
      agentSummary: { total: 0 },
    });
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
const workspaceCheck = result.checks.find((check) => check.id === "workspace-store");
assert.equal(workspaceCheck.isolated, true);
assert.equal(workspaceCheck.taskSummaryTotal, 1);
assert.equal(workspaceCheck.agentSummaryTotal, 1);
assert.ok(requests.some((request) => request.method === "GET" && request.path.includes("accountId=ops-proof-account-20260625223500")));
assert.ok(requests.some((request) => request.method === "GET" && request.path === "/api/workspaces?project=ops-proof-project-20260625223500&includeTasks=true&includeAgentRuns=true"));
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
    if (parsed.pathname === "/api/workspaces" && parsed.searchParams.get("accountId")) return { status: 200, ok: true, json: async () => ({ slots: [{ id: "s" }], taskSummary: { total: 1 }, agentSummary: { total: 1 } }) };
    if (parsed.pathname === "/api/workspaces") return { status: 200, ok: true, json: async () => ({ slots: [] }) };
    if (parsed.pathname === "/api/observability/events" && !init.headers?.authorization) return { status: 401, ok: false, json: async () => ({}) };
    if (parsed.pathname === "/api/observability/events" && init.method === "POST") return { status: 202, ok: true, json: async () => ({ category: "ag2-grounding-invalid", storage: { durable: false }, firingAlerts: [{ id: "ag2-grounding-invalid" }] }) };
    return { status: 200, ok: true, json: async () => ({ dashboard: { title: "Wikidata Explorer API Reliability" }, storage: { durable: false } }) };
  },
});
assert.equal(nonDurable.ok, false);
assert.match(nonDurable.errors.join(" "), /requires durable storage/);

const cliMockDir = path.join(os.tmpdir(), `wikidata-hosted-ops-cli-${Date.now()}`);
await mkdir(cliMockDir, { recursive: true });
await writeFile(path.join(cliMockDir, "mock-fetch.mjs"), `
let savedSlotId = "";
globalThis.fetch = async (url, init = {}) => {
  const parsed = new URL(String(url));
  const body = init.body ? JSON.parse(init.body) : {};
  const json = (status, value) => ({ status, ok: status >= 200 && status < 300, json: async () => value });
  if (parsed.pathname === "/api/workspaces" && !init.headers?.authorization) return json(401, {});
  if (parsed.pathname === "/api/workspaces" && init.method === "POST") {
    savedSlotId = body.slot.id;
    return json(202, { accountId: body.accountId, projectId: body.projectId, slots: [{ id: body.slot.id }], taskSummary: { total: 1 }, agentSummary: { total: 1 } });
  }
  if (parsed.pathname === "/api/workspaces" && init.method === "DELETE") return json(200, {});
  if (parsed.pathname === "/api/workspaces" && parsed.searchParams.get("accountId")) return json(200, { slots: [{ id: savedSlotId }], taskSummary: { total: 1 }, agentSummary: { total: 1 } });
  if (parsed.pathname === "/api/workspaces") return json(200, { slots: [], taskSummary: { total: 0 }, agentSummary: { total: 0 } });
  if (parsed.pathname === "/api/observability/events" && !init.headers?.authorization) return json(401, {});
  if (parsed.pathname === "/api/observability/events" && init.method === "POST") return json(202, { category: "ag2-grounding-invalid", storage: { durable: true }, firingAlerts: [{ id: "ag2-grounding-invalid" }] });
  if (parsed.pathname === "/api/observability/events") return json(200, { dashboard: { title: "Wikidata Explorer API Reliability" }, storage: { durable: true }, retainedEvents: 1 });
  return json(404, {});
};
`, "utf8");

const cli = spawnSync(process.execPath, [
  "--import",
  pathToFileURL(path.join(cliMockDir, "mock-fetch.mjs")).href,
  "scripts/check-hosted-ops-proof.mjs",
], {
  cwd: new URL("..", import.meta.url),
  encoding: "utf8",
  env: {
    ...process.env,
    HOSTED_OPS_BASE_URL: "https://www.wikidataexplorer.com",
    WORKSPACE_STORE_TOKEN: "workspace-token-value",
    API_OBSERVABILITY_RECEIVER_TOKEN: "observability-token-value",
  },
});
assert.equal(cli.status, 0, cli.stderr || cli.stdout);
assert.match(cli.stdout, /PASS hosted-ops-target app=https:\/\/www\.wikidataexplorer\.com/);
assert.match(cli.stdout, /PASS hosted ops proof \(https:\/\/www\.wikidataexplorer\.com\)/);
assert.doesNotMatch(cli.stdout + cli.stderr, /workspace-token-value|observability-token-value|hosted-proof-secret-token/);

console.log("PASS hosted ops proof tests");
