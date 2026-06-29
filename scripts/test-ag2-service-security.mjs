import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ag2ServiceAuthorizationHeader,
  AG2_SERVICE_TOKEN_MISSING_MESSAGE,
  AG2_SERVICE_TOKEN_WEAK_MESSAGE,
  validateAg2ServiceToken,
} from "../lib/ag2-service-auth.mjs";

const strongToken = "a".repeat(32);

assert.deepEqual(validateAg2ServiceToken({}), {
  ok: false,
  status: 503,
  error: AG2_SERVICE_TOKEN_MISSING_MESSAGE,
});
assert.deepEqual(validateAg2ServiceToken({ AG2_SERVICE_TOKEN: "short" }), {
  ok: false,
  status: 503,
  error: AG2_SERVICE_TOKEN_WEAK_MESSAGE,
});
assert.deepEqual(validateAg2ServiceToken({ AG2_SERVICE_TOKEN: strongToken }), {
  ok: true,
  token: strongToken,
});
assert.deepEqual(ag2ServiceAuthorizationHeader({ AG2_SERVICE_TOKEN: strongToken }), {
  ok: true,
  header: `Bearer ${strongToken}`,
});

const nextBridge = readFileSync(new URL("../lib/ag2.ts", import.meta.url), "utf8");
assert.match(nextBridge, /runRemoteAg2Agent\(payload, \{ timeoutMs \}\)/);
assert.doesNotMatch(nextBridge, /^import \{ spawn \} from "node:child_process";/m);
assert.match(nextBridge, /await import\("node:child_process"\)/);

for (const route of ["chat", "entity-summary", "ag2-workflow"]) {
  const routeSource = readFileSync(new URL(`../app/api/${route}/route.ts`, import.meta.url), "utf8");
  assert.match(routeSource, /import \{ Ag2BridgeError \} from "@\/lib\/ag2-errors\.mjs"/);
  assert.match(routeSource, /await import\("@\/lib\/ag2"\)/);
  assert.doesNotMatch(routeSource, /import \{ Ag2BridgeError, runAg2Agent \} from "@\/lib\/ag2"/);
}

const chatRoute = readFileSync(new URL("../app/api/chat/route.ts", import.meta.url), "utf8");
assert.match(chatRoute, /sanitizeChatVisibleContext/);
assert.match(chatRoute, /Invalid chat context/);
assert.match(chatRoute, /mode: "chat", messages, context/);

const remoteBridge = readFileSync(new URL("../lib/ag2-remote-service.mjs", import.meta.url), "utf8");
assert.match(remoteBridge, /ag2ServiceAuthorizationHeader\(env\)/);
assert.match(remoteBridge, /authorization: authorization\.header/);

const service = readFileSync(new URL("../agents/ag2_service.py", import.meta.url), "utf8");
assert.match(service, /hmac\.compare_digest/);
assert.match(service, /Depends\(require_service_token\)/);
assert.match(service, /docs_url="\/docs" if docs_enabled\(\) else None/);
assert.match(service, /AG2_SERVICE_TOKEN_MIN_LENGTH = 32/);

const pythonAgent = readFileSync(new URL("../agents/wikidata_ag2_agent.py", import.meta.url), "utf8");
assert.match(pythonAgent, /VISIBLE WIKIDATA CONTEXT/);
assert.match(pythonAgent, /build_chat_prompt\(messages, payload\.get\("context"\)\)/);
assert.match(pythonAgent, /statement IDs, ranks, qualifiers, references, and source URLs/);

const dockerfile = readFileSync(new URL("../agents/Dockerfile", import.meta.url), "utf8");
assert.match(dockerfile, /USER appuser/);
assert.match(dockerfile, /HEALTHCHECK/);
assert.match(dockerfile, /127\.0\.0\.1:8000\/health/);

const dockerignore = readFileSync(new URL("../.dockerignore", import.meta.url), "utf8");
assert.match(dockerignore, /^\*/m);
for (const requiredAgentFile of [
  "!agents/",
  "!agents/Dockerfile",
  "!agents/requirements.txt",
  "!agents/wikidata_ag2_agent.py",
  "!agents/ag2_service.py",
]) {
  assert.ok(dockerignore.includes(requiredAgentFile), `.dockerignore should allow ${requiredAgentFile}`);
}
for (const excludedPath of [".env", "node_modules", ".tmp", "docs", "public"]) {
  assert.ok(!dockerignore.includes(`!${excludedPath}`), `.dockerignore should not allow ${excludedPath}`);
}

console.log("PASS AG2 service security tests");
