import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { Ag2BridgeError } from "../lib/ag2-errors.mjs";
import { ag2ServiceUrl, runRemoteAg2Agent } from "../lib/ag2-remote-service.mjs";

const strongToken = "remote-service-token-value-32-plus";
const requests = [];

const server = createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const bodyText = Buffer.concat(chunks).toString("utf8");
  const body = bodyText ? JSON.parse(bodyText) : {};
  requests.push({
    method: request.method,
    url: request.url,
    authorization: request.headers.authorization,
    body,
  });

  response.setHeader("content-type", "application/json");

  if (request.url !== "/run" || request.method !== "POST") {
    response.statusCode = 404;
    response.end(JSON.stringify({ ok: false, error: "not found" }));
    return;
  }

  if (request.headers.authorization !== `Bearer ${strongToken}`) {
    response.statusCode = 401;
    response.end(JSON.stringify({ ok: false, status: 401, error: "mock auth failed" }));
    return;
  }

  if (body.payload?.messages?.[0]?.content === "fail") {
    response.statusCode = 503;
    response.end(JSON.stringify({ ok: false, status: 503, error: "mock AG2 service unavailable" }));
    return;
  }

  response.end(JSON.stringify({ ok: true, result: `mocked ${body.payload?.mode} success` }));
});

server.listen(0, "127.0.0.1");
await once(server, "listening");

try {
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const env = {
    AG2_SERVICE_URL: `${baseUrl}/`,
    AG2_SERVICE_TOKEN: strongToken,
  };

  assert.equal(ag2ServiceUrl(env), baseUrl);

  const payload = {
    mode: "chat",
    messages: [{ role: "user", content: "Summarize Q42 evidence." }],
  };
  const result = await runRemoteAg2Agent(payload, { env, timeoutMs: 1000 });

  assert.deepEqual(result, { ok: true, result: "mocked chat success" });
  assert.equal(requests[0].method, "POST");
  assert.equal(requests[0].url, "/run");
  assert.equal(requests[0].authorization, `Bearer ${strongToken}`);
  assert.deepEqual(requests[0].body, { payload });

  await assert.rejects(
    () => runRemoteAg2Agent(payload, { env: { AG2_SERVICE_URL: baseUrl, AG2_SERVICE_TOKEN: "too-short" }, timeoutMs: 1000 }),
    (error) => error instanceof Ag2BridgeError && error.status === 503 && /at least 32 characters/.test(error.message),
  );

  await assert.rejects(
    () => runRemoteAg2Agent({ mode: "chat", messages: [{ role: "user", content: "fail" }] }, { env, timeoutMs: 1000 }),
    (error) => error instanceof Ag2BridgeError && error.status === 503 && /mock AG2 service unavailable/.test(error.message),
  );
} finally {
  server.close();
  await once(server, "close");
}

console.log("PASS AG2 remote service contract tests");