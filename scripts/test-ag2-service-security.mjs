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

const remoteBridge = readFileSync(new URL("../lib/ag2-remote-service.mjs", import.meta.url), "utf8");
assert.match(remoteBridge, /ag2ServiceAuthorizationHeader\(env\)/);
assert.match(remoteBridge, /authorization: authorization\.header/);

const service = readFileSync(new URL("../agents/ag2_service.py", import.meta.url), "utf8");
assert.match(service, /hmac\.compare_digest/);
assert.match(service, /Depends\(require_service_token\)/);
assert.match(service, /docs_url="\/docs" if docs_enabled\(\) else None/);
assert.match(service, /AG2_SERVICE_TOKEN_MIN_LENGTH = 32/);

const dockerfile = readFileSync(new URL("../agents/Dockerfile", import.meta.url), "utf8");
assert.match(dockerfile, /USER appuser/);

console.log("PASS AG2 service security tests");
