import { buildWorkspaceSnapshot } from "./workspace-snapshot.mjs";

const DEFAULT_BASE_URL = "https://www.wikidataexplorer.com";
const SECRET_MARKER = "hosted-proof-secret-token";
const SECRET_SHAPED_MARKER = `token=${SECRET_MARKER}`;

function cleanOneLine(value = "", maxLength = 160) {
  return String(value ?? "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanBaseUrl(value = DEFAULT_BASE_URL) {
  const raw = cleanOneLine(value || DEFAULT_BASE_URL, 500);
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function proofIds(now = new Date().toISOString()) {
  const suffix = now.replace(/[^0-9]/g, "").slice(0, 14) || "now";
  return {
    accountId: `ops-proof-account-${suffix}`,
    projectId: `ops-proof-project-${suffix}`,
    slotId: `ops-proof-slot-${suffix}`,
  };
}

async function jsonResponse(response) {
  return response.json().catch(() => ({}));
}

function assertSafeJson(value, label) {
  const text = JSON.stringify(value);
  if (text.includes(SECRET_MARKER)) {
    throw new Error(`${label} leaked secret-shaped proof text.`);
  }
}

async function fetchJson(fetchImpl, baseUrl, route, init = {}) {
  const response = await fetchImpl(new URL(route, baseUrl), init);
  return { response, body: await jsonResponse(response) };
}

function authorizationHeader(token) {
  return { authorization: `Bearer ${token}` };
}

export function hostedOpsProofConfig(env = {}) {
  const baseUrl = cleanBaseUrl(env.HOSTED_OPS_BASE_URL || env.PRODUCTION_BASE_URL || DEFAULT_BASE_URL);
  const workspaceToken = cleanOneLine(env.WORKSPACE_STORE_TOKEN || "", 500);
  const observabilityToken = cleanOneLine(env.API_OBSERVABILITY_RECEIVER_TOKEN || env.API_OBSERVABILITY_WEBHOOK_TOKEN || "", 500);
  const requireDurableObservability = String(env.HOSTED_OPS_REQUIRE_DURABLE_OBSERVABILITY || "true").toLowerCase() !== "false";

  return {
    ok: Boolean(baseUrl && workspaceToken && observabilityToken),
    baseUrl,
    workspaceToken,
    observabilityToken,
    requireDurableObservability,
    errors: [
      ...(baseUrl ? [] : ["HOSTED_OPS_BASE_URL or PRODUCTION_BASE_URL must be HTTPS, localhost, or 127.0.0.1."]),
      ...(workspaceToken ? [] : ["WORKSPACE_STORE_TOKEN is required for hosted workspace proof."]),
      ...(observabilityToken ? [] : ["API_OBSERVABILITY_RECEIVER_TOKEN or API_OBSERVABILITY_WEBHOOK_TOKEN is required for hosted observability proof."]),
    ],
  };
}

async function proveWorkspaceStore(config, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const now = options.now || new Date().toISOString();
  const ids = options.ids || proofIds(now);
  const auth = authorizationHeader(config.workspaceToken);
  const projectRoute = `/api/workspaces?accountId=${encodeURIComponent(ids.accountId)}&project=${encodeURIComponent(ids.projectId)}&includeTasks=true&includeAgentRuns=true`;
  const flatProjectRoute = `/api/workspaces?project=${encodeURIComponent(ids.projectId)}&includeTasks=true&includeAgentRuns=true`;

  const unauthenticated = await fetchJson(fetchImpl, config.baseUrl, projectRoute);
  if (unauthenticated.response.status !== 401) {
    throw new Error(`workspace store expected unauthenticated 401, got ${unauthenticated.response.status}`);
  }

  const snapshot = buildWorkspaceSnapshot({
    entityId: "Q42",
    entityLabel: "Douglas Adams",
    createdAt: now,
    reviewTaskStatuses: { "Q42:claim:P31:hosted-proof": "ready_to_draft" },
    curationTasks: [{
      id: "Q42:claim:P31:hosted-proof",
      entityId: "Q42",
      propertyId: "P31",
      propertyLabel: "instance of",
      statementId: "Q42$hosted-proof",
      severity: "high",
      status: "ready_to_draft",
      title: "Hosted proof source check",
      detail: `Hosted proof should redact ${SECRET_SHAPED_MARKER}.`,
      value: "human",
      sourceHints: [{ kind: "stated-in", label: "stated in", value: "Wikidata", url: "https://www.wikidata.org/wiki/Q42" }],
    }],
    savedAgentRuns: [{
      id: `run-${ids.slotId}`,
      entityId: "Q42",
      entityLabel: "Douglas Adams",
      action: "verify",
      title: "Hosted proof verifier",
      result: `Grounded hosted proof result ${SECRET_SHAPED_MARKER}.`,
      createdAt: now,
    }],
  });

  try {
    const saved = await fetchJson(fetchImpl, config.baseUrl, "/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json", ...auth },
      body: JSON.stringify({
        accountId: ids.accountId,
        projectId: ids.projectId,
        slot: {
          id: ids.slotId,
          label: "Hosted ops proof workspace",
          snapshot,
          createdAt: now,
          updatedAt: now,
        },
        includeTasks: true,
        includeAgentRuns: true,
      }),
    });
    assertSafeJson(saved.body, "workspace save response");
    if (saved.response.status !== 202 || saved.body.accountId !== ids.accountId || saved.body.taskSummary?.total !== 1 || saved.body.agentSummary?.total !== 1) {
      throw new Error(`workspace store save proof failed with ${saved.response.status} ${JSON.stringify(saved.body)}`);
    }

    const listed = await fetchJson(fetchImpl, config.baseUrl, projectRoute, { headers: auth });
    assertSafeJson(listed.body, "workspace list response");
    if (
      listed.response.status !== 200 ||
      !listed.body.slots?.some((slot) => slot.id === ids.slotId) ||
      listed.body.taskSummary?.total !== 1 ||
      listed.body.agentSummary?.total !== 1
    ) {
      throw new Error(`workspace store list proof failed with ${listed.response.status} ${JSON.stringify(listed.body)}`);
    }

    const flatListed = await fetchJson(fetchImpl, config.baseUrl, flatProjectRoute, { headers: auth });
    assertSafeJson(flatListed.body, "workspace flat project response");
    if (flatListed.response.status !== 200 || flatListed.body.slots?.some((slot) => slot.id === ids.slotId)) {
      throw new Error(`workspace store account isolation proof failed with ${flatListed.response.status} ${JSON.stringify(flatListed.body)}`);
    }

    return {
      ok: true,
      accountId: ids.accountId,
      projectId: ids.projectId,
      slotId: ids.slotId,
      isolated: true,
      taskSummaryTotal: listed.body.taskSummary.total,
      agentSummaryTotal: listed.body.agentSummary.total,
    };
  } finally {
    await fetchJson(fetchImpl, config.baseUrl, "/api/workspaces", {
      method: "DELETE",
      headers: { "content-type": "application/json", ...auth },
      body: JSON.stringify({
        accountId: ids.accountId,
        projectId: ids.projectId,
        slotId: ids.slotId,
        includeTasks: true,
        includeAgentRuns: true,
      }),
    }).catch(() => {});
  }
}

async function proveObservabilityReceiver(config, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const now = options.now || new Date().toISOString();
  const auth = authorizationHeader(config.observabilityToken);

  const unauthenticated = await fetchJson(fetchImpl, config.baseUrl, "/api/observability/events");
  if (unauthenticated.response.status !== 401) {
    throw new Error(`observability receiver expected unauthenticated 401, got ${unauthenticated.response.status}`);
  }

  const posted = await fetchJson(fetchImpl, config.baseUrl, "/api/observability/events", {
    method: "POST",
    headers: { "content-type": "application/json", ...auth },
    body: JSON.stringify({
      event: {
        route: "/api/chat",
        status: 502,
        category: "ag2-grounding-invalid",
        message: `Hosted proof grounding check ${SECRET_SHAPED_MARKER}.`,
        createdAt: now,
      },
    }),
  });
  assertSafeJson(posted.body, "observability post response");
  if (posted.response.status !== 202 || posted.body.category !== "ag2-grounding-invalid" || !posted.body.firingAlerts?.some((alert) => alert.id === "ag2-grounding-invalid")) {
    throw new Error(`observability post proof failed with ${posted.response.status} ${JSON.stringify(posted.body)}`);
  }
  if (config.requireDurableObservability && posted.body.storage?.durable !== true) {
    throw new Error("observability receiver proof requires durable storage but response was not durable.");
  }

  const snapshot = await fetchJson(fetchImpl, config.baseUrl, "/api/observability/events", { headers: auth });
  assertSafeJson(snapshot.body, "observability snapshot response");
  if (snapshot.response.status !== 200 || snapshot.body.dashboard?.title !== "Wikidata Explorer API Reliability") {
    throw new Error(`observability snapshot proof failed with ${snapshot.response.status} ${JSON.stringify(snapshot.body)}`);
  }
  if (config.requireDurableObservability && snapshot.body.storage?.durable !== true) {
    throw new Error("observability snapshot proof requires durable storage but response was not durable.");
  }

  return {
    ok: true,
    retainedEvents: snapshot.body.retainedEvents,
    durable: snapshot.body.storage?.durable === true,
  };
}

export async function runHostedOpsProof(options = {}) {
  const config = options.config || hostedOpsProofConfig(options.env || process.env || {});
  if (!config.ok) return { ok: false, baseUrl: config.baseUrl, errors: config.errors, checks: [] };

  const checks = [];
  try {
    checks.push({ id: "workspace-store", ...(await proveWorkspaceStore(config, options)) });
    checks.push({ id: "observability-receiver", ...(await proveObservabilityReceiver(config, options)) });
    return { ok: true, baseUrl: config.baseUrl, checks, errors: [] };
  } catch (error) {
    return {
      ok: false,
      baseUrl: config.baseUrl,
      checks,
      errors: [cleanOneLine(error?.message || error, 500)],
    };
  }
}
