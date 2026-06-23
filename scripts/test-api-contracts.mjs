const baseUrl = process.env.API_CONTRACT_BASE_URL || "http://localhost:3000";

async function postJson(route, body) {
  const response = await fetch(new URL(route, baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
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

await check("chat rejects malformed JSON", "/api/chat", "{", 400, "valid JSON");
await check("chat rejects empty messages", "/api/chat", { messages: [] }, 400, "Invalid chat request");
await check("entity summary rejects missing entity", "/api/entity-summary", { entity: null }, 400, "Invalid entity summary request");
await check("workflow rejects unsupported action", "/api/ag2-workflow", { action: "delete", entityId: "Q42" }, 400, "Invalid AG2 workflow request");
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