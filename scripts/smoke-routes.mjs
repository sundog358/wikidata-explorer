const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3002";
const routes = ["/", "/search", "/search?q=Q42", "/docs", "/about", "/chat"];

async function checkRoute(route) {
  const url = new URL(route, baseUrl).toString();
  const response = await fetch(url, { redirect: "manual" });
  const ok = response.status >= 200 && response.status < 300;

  return {
    ok,
    route,
    status: response.status,
    url,
  };
}

const results = await Promise.all(routes.map(checkRoute));

for (const result of results) {
  const marker = result.ok ? "PASS" : "FAIL";
  console.log(`${marker} ${result.route} ${result.status}`);
}

const failures = results.filter((result) => !result.ok);
if (failures.length > 0) {
  console.error(`Smoke check failed for ${failures.length} route(s).`);
  process.exit(1);
}