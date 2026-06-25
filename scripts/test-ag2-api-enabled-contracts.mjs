import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { spawn } from "node:child_process";

const strongToken = "enabled-api-contract-token-value-32-plus";

const fixtureEntity = {
  id: "Q42",
  type: "item",
  label: "Douglas Adams",
  description: "English author and humorist",
  statements: [
    {
      propertyId: "P31",
      propertyLabel: "instance of",
      rank: "normal",
      value: "human",
      qualifiers: [],
      references: [
        {
          hash: "reference-one",
          parts: [
            {
              propertyId: "P248",
              propertyLabel: "stated in",
              value: "Integrated Authority File",
            },
          ],
        },
      ],
    },
  ],
};

const fixtureGraphFocus = {
  id: "Q5",
  label: "human",
  property: "instance of",
  propertyId: "P31",
  kind: "item",
  rank: "normal",
  dataType: "wikibase-item",
  qualifierCount: 0,
  referenceCount: 1,
  statementId: "Q42$P31-Q5",
  value: "human",
};

async function availablePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  server.close();
  await once(server, "close");
  return port;
}

async function waitForApp(baseUrl, child, logs) {
  const deadline = Date.now() + 60000;
  let lastError = "";

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next server exited early with code ${child.exitCode}.\n${logs.join("")}`);
    }

    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for AI-enabled Next server at ${baseUrl}: ${lastError}\n${logs.join("")}`);
}

async function postJson(baseUrl, route, body) {
  const response = await fetch(new URL(route, baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json().catch(() => ({})) };
}

function ag2ResponseFor(payload) {
  if (payload?.mode === "chat") {
    return {
      ok: true,
      message: "Mock AG2 chat response grounded in Q42, P31, and Q5.",
    };
  }

  if (payload?.mode === "entity_summary") {
    return {
      ok: true,
      summary: "Mock AG2 entity summary for Douglas Adams with P31 evidence.",
    };
  }

  if (payload?.mode === "workflow") {
    return {
      ok: true,
      result: `Mock AG2 ${payload.action} workflow for ${payload.entity?.id || payload.entityId}.`,
    };
  }

  return {
    ok: false,
    status: 400,
    error: "unexpected mock AG2 payload",
  };
}

const ag2Requests = [];
const ag2Server = createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const bodyText = Buffer.concat(chunks).toString("utf8");
  const body = bodyText ? JSON.parse(bodyText) : {};

  ag2Requests.push({
    method: request.method,
    url: request.url,
    authorization: request.headers.authorization,
    body,
  });

  response.setHeader("content-type", "application/json");

  if (request.method !== "POST" || request.url !== "/run") {
    response.statusCode = 404;
    response.end(JSON.stringify({ ok: false, status: 404, error: "not found" }));
    return;
  }

  if (request.headers.authorization !== `Bearer ${strongToken}`) {
    response.statusCode = 401;
    response.end(JSON.stringify({ ok: false, status: 401, error: "mock AG2 auth failed" }));
    return;
  }

  const result = ag2ResponseFor(body.payload);
  response.statusCode = result.ok ? 200 : result.status || 400;
  response.end(JSON.stringify(result));
});

ag2Server.listen(0, "127.0.0.1");
await once(ag2Server, "listening");

let nextServer = null;

try {
  const ag2Address = ag2Server.address();
  const ag2BaseUrl = `http://127.0.0.1:${ag2Address.port}`;
  const nextPort = await availablePort();
  const nextBaseUrl = `http://127.0.0.1:${nextPort}`;
  const logs = [];

  nextServer = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(nextPort)], {
    env: {
      ...process.env,
      ENABLE_AI_AGENTS: "true",
      NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
      AG2_SERVICE_URL: ag2BaseUrl,
      AG2_SERVICE_TOKEN: strongToken,
      AI_AGENT_RATE_LIMIT_MAX: "100",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  nextServer.stdout.setEncoding("utf8");
  nextServer.stderr.setEncoding("utf8");
  nextServer.stdout.on("data", (chunk) => logs.push(chunk));
  nextServer.stderr.on("data", (chunk) => logs.push(chunk));

  await waitForApp(nextBaseUrl, nextServer, logs);

  const chat = await postJson(nextBaseUrl, "/api/chat", {
    messages: [{ role: "user", content: "Summarize Q42 with P31 evidence." }],
  });
  assert.equal(chat.response.status, 200);
  assert.match(chat.body.message || "", /Q42/);

  const summary = await postJson(nextBaseUrl, "/api/entity-summary", {
    entity: fixtureEntity,
  });
  assert.equal(summary.response.status, 200);
  assert.match(summary.body.summary || "", /Douglas Adams/);

  const workflow = await postJson(nextBaseUrl, "/api/ag2-workflow", {
    action: "graph",
    entityId: "Q42",
    entity: fixtureEntity,
    graphFocus: fixtureGraphFocus,
  });
  assert.equal(workflow.response.status, 200);
  assert.match(workflow.body.result || "", /graph workflow/);
  assert.equal(workflow.body.safety?.allowed, true);

  assert.deepEqual(
    ag2Requests.map((request) => request.body.payload?.mode),
    ["chat", "entity_summary", "workflow"],
  );
  assert.equal(ag2Requests.every((request) => request.authorization === `Bearer ${strongToken}`), true);
  assert.equal(ag2Requests[0].body.payload.messages[0].content, "Summarize Q42 with P31 evidence.");
  assert.equal(ag2Requests[1].body.payload.entity.id, "Q42");
  assert.equal(ag2Requests[2].body.payload.graphFocus.propertyId, "P31");
  assert.equal(ag2Requests[2].body.payload.entity.statements[0].references[0].parts[0].propertyId, "P248");
} finally {
  if (nextServer && nextServer.exitCode === null) {
    nextServer.kill();
    await Promise.race([
      once(nextServer, "exit"),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  }

  ag2Server.close();
  await once(ag2Server, "close");
}

console.log("PASS AI-enabled AG2 API route success contracts");
