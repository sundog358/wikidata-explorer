import assert from "node:assert/strict";
import {
  aiRateLimitKey,
  aiRateLimitOptions,
  checkAiRateLimit,
  resetAiRateLimitBuckets,
} from "../lib/ai-rate-limit.mjs";

assert.deepEqual(aiRateLimitOptions({}), { windowMs: 60_000, maxRequests: 20 });
assert.deepEqual(
  aiRateLimitOptions({ AI_AGENT_RATE_LIMIT_WINDOW_MS: "1000", AI_AGENT_RATE_LIMIT_MAX: "2" }),
  { windowMs: 1000, maxRequests: 2 },
);

assert.equal(aiRateLimitKey(new Headers({ "x-forwarded-for": "203.0.113.1, 10.0.0.1" })), "203.0.113.1");
assert.equal(aiRateLimitKey(new Headers({ "x-real-ip": "198.51.100.2" })), "198.51.100.2");

resetAiRateLimitBuckets();
const env = { AI_AGENT_RATE_LIMIT_WINDOW_MS: "1000", AI_AGENT_RATE_LIMIT_MAX: "2" };
assert.equal(checkAiRateLimit({ key: "user-a", now: 0, env }).allowed, true);
assert.equal(checkAiRateLimit({ key: "user-a", now: 100, env }).allowed, true);
const blocked = checkAiRateLimit({ key: "user-a", now: 200, env });
assert.equal(blocked.allowed, false);
assert.equal(blocked.retryAfterMs, 800);
assert.equal(checkAiRateLimit({ key: "user-a", now: 1000, env }).allowed, true);

console.log("PASS AI rate limit tests");
