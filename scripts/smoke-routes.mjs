import { aiAgentsEnabled, AI_DISABLED_MESSAGE } from "../lib/ai-feature-flags.mjs";

const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const aiUiEnabled = aiAgentsEnabled({ NEXT_PUBLIC_ENABLE_AI_AGENTS: process.env.NEXT_PUBLIC_ENABLE_AI_AGENTS });
const aiApiEnabled = aiAgentsEnabled({ ENABLE_AI_AGENTS: process.env.ENABLE_AI_AGENTS });

const routeChecks = [
  { route: "/", includes: "Wikidata Explorer" },
  { route: "/search", includes: "Search" },
  { route: "/search?q=Q42", includes: "Wikidata Explorer" },
  { route: "/docs", includes: "Developer Commands" },
  { route: "/about", includes: "Portfolio project" },
  aiUiEnabled
    ? { route: "/chat", includes: "Wikidata Research Chat" }
    : { route: "/chat", includes: "Research Assistant is disabled" },
  aiUiEnabled
    ? { route: "/agents", includes: "Agent Workbench" }
    : { route: "/agents", includes: "AI agents are disabled" },
];

async function checkRoute({ route, includes }) {
  const url = new URL(route, baseUrl).toString();
  const response = await fetch(url, { redirect: "manual" });
  const body = await response.text();
  const ok = response.status >= 200 && response.status < 300 && body.includes(includes);

  return {
    ok,
    route,
    status: response.status,
    reason: ok ? "" : `expected page to include ${JSON.stringify(includes)}`,
  };
}

function expectedAiApiStatus(response) {
  return aiApiEnabled ? response.status === 400 || response.status === 503 : response.status === 404;
}

function expectedAiApiReason() {
  return aiApiEnabled ? "expected validation or missing-key response" : `expected disabled AI response containing ${JSON.stringify(AI_DISABLED_MESSAGE)}`;
}

async function checkInvalidChatRequest() {
  const url = new URL("/api/chat", baseUrl).toString();
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [] }),
  });
  const body = await response.json().catch(() => ({}));
  const ok = expectedAiApiStatus(response) && (aiApiEnabled || String(body.error || "").includes(AI_DISABLED_MESSAGE));

  return {
    ok,
    route: "/api/chat invalid request",
    status: response.status,
    reason: ok ? "" : expectedAiApiReason(),
  };
}

async function checkInvalidEntitySummaryRequest() {
  const url = new URL("/api/entity-summary", baseUrl).toString();
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entity: null }),
  });
  const body = await response.json().catch(() => ({}));
  const ok = expectedAiApiStatus(response) && (aiApiEnabled || String(body.error || "").includes(AI_DISABLED_MESSAGE));

  return {
    ok,
    route: "/api/entity-summary invalid request",
    status: response.status,
    reason: ok ? "" : expectedAiApiReason(),
  };
}

async function checkInvalidAg2WorkflowRequest() {
  const url = new URL("/api/ag2-workflow", baseUrl).toString();
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "compare", entity: null }),
  });
  const body = await response.json().catch(() => ({}));
  const ok = expectedAiApiStatus(response) && (aiApiEnabled || String(body.error || "").includes(AI_DISABLED_MESSAGE));

  return {
    ok,
    route: "/api/ag2-workflow invalid request",
    status: response.status,
    reason: ok ? "" : expectedAiApiReason(),
  };
}

const results = [
  ...(await Promise.all(routeChecks.map(checkRoute))),
  await checkInvalidChatRequest(),
  await checkInvalidEntitySummaryRequest(),
  await checkInvalidAg2WorkflowRequest(),
];

for (const result of results) {
  const marker = result.ok ? "PASS" : "FAIL";
  console.log(`${marker} ${result.route} ${result.status}${result.reason ? ` - ${result.reason}` : ""}`);
}

const failures = results.filter((result) => !result.ok);
if (failures.length > 0) {
  console.error(`Smoke check failed for ${failures.length} check(s).`);
  process.exit(1);
}
