import assert from "node:assert/strict";
import { hasOpenAiApiKey, missingOpenAiApiKeyMessage } from "../lib/ag2-config.mjs";

assert.equal(hasOpenAiApiKey({}), false);
assert.equal(hasOpenAiApiKey({ OPENAI_API_KEY: "" }), false);
assert.equal(hasOpenAiApiKey({ OPENAI_API_KEY: "   " }), false);
assert.equal(hasOpenAiApiKey({ OPENAI_API_KEY: "test-key-value" }), true);
assert.match(missingOpenAiApiKeyMessage(), /OpenAI API key is not configured/);

console.log("PASS AG2 config tests");