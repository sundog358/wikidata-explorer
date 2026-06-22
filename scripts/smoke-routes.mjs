const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";

const routeChecks = [
  { route: "/", includes: "Wikidata Explorer" },
  { route: "/search", includes: "Search" },
  { route: "/search?q=Q42", includes: "Wikidata Explorer" },
  { route: "/docs", includes: "Developer Commands" },
  { route: "/about", includes: "Portfolio project" },
  { route: "/chat", includes: "Wikidata Research Chat" },
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

async function checkInvalidChatRequest() {
  const url = new URL("/api/chat", baseUrl).toString();
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [] }),
  });

  return {
    ok: response.status === 400 || response.status === 503,
    route: "/api/chat invalid request",
    status: response.status,
    reason: response.status === 400 || response.status === 503 ? "" : "expected validation or missing-key response",
  };
}

const results = [
  ...(await Promise.all(routeChecks.map(checkRoute))),
  await checkInvalidChatRequest(),
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