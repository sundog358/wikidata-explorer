import assert from "node:assert/strict";
import { ag2RetryDelayMs, normalizeAg2RetryOptions, shouldRetryAg2Error } from "../lib/ag2-reliability.mjs";

assert.deepEqual(normalizeAg2RetryOptions({ maxAttempts: 9, baseDelayMs: 10, maxDelayMs: 50000 }), {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 10000,
});

assert.equal(ag2RetryDelayMs(1, { baseDelayMs: 200, maxDelayMs: 1000 }), 200);
assert.equal(ag2RetryDelayMs(3, { baseDelayMs: 200, maxDelayMs: 700 }), 700);

assert.equal(shouldRetryAg2Error({ status: 500, message: "The AG2 service could not complete." }, 1, { maxAttempts: 2 }), true);
assert.equal(shouldRetryAg2Error({ status: 429, message: "rate limited" }, 1, { maxAttempts: 2 }), true);
assert.equal(shouldRetryAg2Error({ status: 503, message: "temporarily unavailable" }, 2, { maxAttempts: 2 }), false);
assert.equal(shouldRetryAg2Error({ status: 400, message: "Comparison agent requires a second entity ID." }, 1, { maxAttempts: 2 }), false);
assert.equal(shouldRetryAg2Error({ status: 401, message: "The OpenAI API key was rejected." }, 1, { maxAttempts: 2 }), false);
assert.equal(shouldRetryAg2Error({ status: 429, message: "The OpenAI API is rate limited or out of quota." }, 1, { maxAttempts: 2 }), false);

console.log("PASS AG2 reliability tests");
