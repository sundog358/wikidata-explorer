import { aiAgentsEnabled, AI_DISABLED_MESSAGE } from "../lib/ai-feature-flags.mjs";
import { buildWorkspaceSnapshot } from "../lib/workspace-snapshot.mjs";

const baseUrl = process.env.API_CONTRACT_BASE_URL || "http://localhost:3000";
const aiApiEnabled = aiAgentsEnabled({ ENABLE_AI_AGENTS: process.env.ENABLE_AI_AGENTS });
const observabilityReceiverToken = process.env.API_OBSERVABILITY_RECEIVER_TOKEN || "";
const workspaceStoreToken = process.env.WORKSPACE_STORE_TOKEN || "";

async function postJson(route, body) {
  return postJsonWithHeaders(route, body);
}

async function postJsonWithHeaders(route, body, headers = {}) {
  const response = await fetch(new URL(route, baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json().catch(() => ({})) };
}

async function getJson(route, headers = {}) {
  const response = await fetch(new URL(route, baseUrl), { headers });
  return { response, body: await response.json().catch(() => ({})) };
}

async function postRaw(route, raw) {
  const response = await fetch(new URL(route, baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw,
  });
  return { response, body: await response.json().catch(() => ({})) };
}

async function check(name, route, request, expectedStatus, expectedError) {
  const { response, body } = typeof request === "string" ? await postRaw(route, request) : await postJson(route, request);
  const ok = response.status === expectedStatus && String(body.error || "").includes(expectedError);
  console.log(`${ok ? "PASS" : "FAIL"} ${name} ${response.status}`);
  if (!ok) {
    throw new Error(`${name} expected ${expectedStatus} containing ${JSON.stringify(expectedError)}, got ${response.status} ${JSON.stringify(body)}`);
  }
}

async function checkObservabilityReceiverContract() {
  const unauthenticated = await getJson("/api/observability/events");
  if (!observabilityReceiverToken) {
    const ok = [401, 503].includes(unauthenticated.response.status);
    console.log(`${ok ? "PASS" : "FAIL"} observability receiver fails closed ${unauthenticated.response.status}`);
    if (!ok) {
      throw new Error(`observability receiver should fail closed without a local contract token, got ${unauthenticated.response.status}`);
    }
    return;
  }

  const unauthenticatedOk = unauthenticated.response.status === 401;
  console.log(`${unauthenticatedOk ? "PASS" : "FAIL"} observability receiver rejects unauthenticated read ${unauthenticated.response.status}`);
  if (!unauthenticatedOk) {
    throw new Error(`observability receiver expected unauthenticated read to return 401, got ${unauthenticated.response.status}`);
  }

  const authorization = `Bearer ${observabilityReceiverToken}`;
  const monitorEvent = {
    event: {
      route: "/api/chat",
      status: 502,
      category: "ag2-grounding-invalid",
      message: "Grounding references missing Bearer contract-secret-token",
      createdAt: "2026-06-25T22:30:00.000Z",
    },
  };
  const posted = await postJsonWithHeaders("/api/observability/events", monitorEvent, { authorization });
  const postOk = posted.response.status === 202 &&
    posted.body.received === true &&
    posted.body.category === "ag2-grounding-invalid" &&
    posted.body.firingAlerts?.some((alert) => alert.id === "ag2-grounding-invalid");
  console.log(`${postOk ? "PASS" : "FAIL"} observability receiver accepts grounded alert ${posted.response.status}`);
  if (!postOk) {
    throw new Error(`observability receiver expected 202 grounded alert response, got ${posted.response.status} ${JSON.stringify(posted.body)}`);
  }

  const snapshot = await getJson("/api/observability/events", { authorization });
  const snapshotText = JSON.stringify(snapshot.body);
  const snapshotOk = snapshot.response.status === 200 &&
    snapshot.body.dashboard?.title === "Wikidata Explorer API Reliability" &&
    snapshot.body.retainedEvents >= 1 &&
    snapshot.body.alertResults?.some((alert) => alert.id === "ag2-grounding-invalid" && alert.firing === true) &&
    !snapshotText.includes("contract-secret-token");
  console.log(`${snapshotOk ? "PASS" : "FAIL"} observability receiver exposes sanitized snapshot ${snapshot.response.status}`);
  if (!snapshotOk) {
    throw new Error(`observability receiver expected sanitized dashboard snapshot, got ${snapshot.response.status} ${snapshotText}`);
  }
}

async function checkWorkspaceStoreContract() {
  const unauthenticated = await getJson("/api/workspaces?project=contract-team");
  if (!workspaceStoreToken) {
    const ok = [401, 503].includes(unauthenticated.response.status);
    console.log(`${ok ? "PASS" : "FAIL"} workspace store fails closed ${unauthenticated.response.status}`);
    if (!ok) {
      throw new Error(`workspace store should fail closed without a local contract token, got ${unauthenticated.response.status}`);
    }
    return;
  }

  const unauthenticatedOk = unauthenticated.response.status === 401;
  console.log(`${unauthenticatedOk ? "PASS" : "FAIL"} workspace store rejects unauthenticated read ${unauthenticated.response.status}`);
  if (!unauthenticatedOk) {
    throw new Error(`workspace store expected unauthenticated read to return 401, got ${unauthenticated.response.status}`);
  }

  const authorization = `Bearer ${workspaceStoreToken}`;
  const snapshot = buildWorkspaceSnapshot({
    entityId: "Q42",
    entityLabel: "Douglas Adams",
    createdAt: "2026-06-25T22:35:00.000Z",
    reviewTaskStatuses: { "Q42:claim:P31:unreferenced": "ready_to_draft" },
    savedAgentRuns: [{
      id: "run-contract",
      entityId: "Q42",
      entityLabel: "Douglas Adams",
      action: "verify",
      title: "Verifier",
      result: "Grounded result token=contract-secret-token",
      createdAt: "2026-06-25T22:35:00.000Z",
    }],
  });

  const saved = await postJsonWithHeaders("/api/workspaces", {
    projectId: "contract-team",
    slot: {
      id: "workspace-q42",
      label: "Q42 contract workspace",
      snapshot,
      createdAt: "2026-06-25T22:35:00.000Z",
      updatedAt: "2026-06-25T22:36:00.000Z",
    },
  }, { authorization });
  const savedText = JSON.stringify(saved.body);
  const savedOk = saved.response.status === 202 &&
    saved.body.projectId === "contract-team" &&
    saved.body.slots?.[0]?.entityId === "Q42" &&
    saved.body.slots?.[0]?.snapshot?.review?.taskStatuses?.["Q42:claim:P31:unreferenced"] === "ready_to_draft" &&
    !savedText.includes("contract-secret-token");
  console.log(`${savedOk ? "PASS" : "FAIL"} workspace store saves sanitized slot ${saved.response.status}`);
  if (!savedOk) {
    throw new Error(`workspace store expected 202 sanitized slot response, got ${saved.response.status} ${savedText}`);
  }

  const listed = await getJson("/api/workspaces?project=contract-team", { authorization });
  const listedOk = listed.response.status === 200 &&
    listed.body.slots?.some((slot) => slot.id === "workspace-q42" && slot.entityId === "Q42");
  console.log(`${listedOk ? "PASS" : "FAIL"} workspace store lists project slots ${listed.response.status}`);
  if (!listedOk) {
    throw new Error(`workspace store expected saved slot in list response, got ${listed.response.status} ${JSON.stringify(listed.body)}`);
  }

  const removed = await fetch(new URL("/api/workspaces", baseUrl), {
    method: "DELETE",
    headers: { "content-type": "application/json", authorization },
    body: JSON.stringify({ projectId: "contract-team", slotId: "workspace-q42" }),
  });
  const removedBody = await removed.json().catch(() => ({}));
  const removedOk = removed.status === 200 &&
    Array.isArray(removedBody.slots) &&
    !removedBody.slots.some((slot) => slot.id === "workspace-q42");
  console.log(`${removedOk ? "PASS" : "FAIL"} workspace store removes project slot ${removed.status}`);
  if (!removedOk) {
    throw new Error(`workspace store expected slot removal, got ${removed.status} ${JSON.stringify(removedBody)}`);
  }
}

await checkObservabilityReceiverContract();
await checkWorkspaceStoreContract();

if (!aiApiEnabled) {
  await check("chat disabled in public mode", "/api/chat", "{", 404, AI_DISABLED_MESSAGE);
  await check("entity summary disabled in public mode", "/api/entity-summary", { entity: null }, 404, AI_DISABLED_MESSAGE);
  await check("workflow disabled in public mode", "/api/ag2-workflow", { action: "delete", entityId: "Q42" }, 404, AI_DISABLED_MESSAGE);
  console.log("PASS public AI-off API contract tests");
} else {
  await check("chat rejects malformed JSON", "/api/chat", "{", 400, "valid JSON");
  await check("chat rejects empty messages", "/api/chat", { messages: [] }, 400, "Invalid chat request");
  await check("entity summary rejects missing entity", "/api/entity-summary", { entity: null }, 400, "Invalid entity summary request");
  await check("workflow rejects unsupported action", "/api/ag2-workflow", { action: "delete", entityId: "Q42" }, 400, "Invalid AG2 workflow request");
  await check("workflow graph rejects invalid graph focus", "/api/ag2-workflow", { action: "graph", entityId: "Q42", graphFocus: { id: "bad" } }, 400, "Invalid AG2 workflow request");
  await check("workflow graph requires visible entity", "/api/ag2-workflow", { action: "graph", entityId: "Q42" }, 400, "requires visible entity context");
  await check("workflow suggest requires visible entity", "/api/ag2-workflow", { action: "suggest", entityId: "Q42" }, 400, "requires visible entity context");
  await check("workflow compare requires second entity", "/api/ag2-workflow", {
    action: "compare",
    entity: {
      id: "Q42",
      type: "item",
      label: "Douglas Adams",
      description: "English author and humorist",
      statements: [{ propertyId: "P31", propertyLabel: "instance of", rank: "normal", value: "human", qualifiers: [], references: [] }],
    },
  }, 403, "Autonomy safety policy blocked");

  console.log("PASS API contract tests");
}
