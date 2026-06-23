import assert from "node:assert/strict";
import { aiAgentsEnabled, AI_DISABLED_MESSAGE } from "../lib/ai-feature-flags.mjs";

assert.equal(aiAgentsEnabled({}), false);
assert.equal(aiAgentsEnabled({ NEXT_PUBLIC_ENABLE_AI_AGENTS: "true" }), true);
assert.equal(aiAgentsEnabled({ NEXT_PUBLIC_ENABLE_AI_AGENTS: "1" }), true);
assert.equal(aiAgentsEnabled({ ENABLE_AI_AGENTS: "yes" }), true);
assert.equal(aiAgentsEnabled({ NEXT_PUBLIC_ENABLE_AI_AGENTS: "false", ENABLE_AI_AGENTS: "on" }), true);
assert.match(AI_DISABLED_MESSAGE, /AI agents are disabled/);

console.log("PASS AI feature flags");
