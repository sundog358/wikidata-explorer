import assert from "node:assert/strict";
import { validateDeployEnv } from "../lib/deploy-env-validation.mjs";

const strongToken = "deploy-token-value-with-32-plus-chars";

assert.equal(validateDeployEnv({}, { mode: "public-vercel" }).ok, true);

const publicAiOn = validateDeployEnv({
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
}, { mode: "public-vercel" });
assert.equal(publicAiOn.ok, false);
assert.match(publicAiOn.errors.join(" "), /Public Vercel deploy/);

const publicWithKey = validateDeployEnv({ OPENAI_API_KEY: "sk-test" }, { mode: "public-vercel" });
assert.equal(publicWithKey.ok, true);
assert.match(publicWithKey.warnings.join(" "), /not needed/);

const aiMissingService = validateDeployEnv({
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
  AG2_SERVICE_TOKEN: strongToken,
}, { mode: "ai-container" });
assert.equal(aiMissingService.ok, false);
assert.match(aiMissingService.errors.join(" "), /AG2_SERVICE_URL/);

const aiWeakToken = validateDeployEnv({
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
  AG2_SERVICE_URL: "https://agents.example.com",
  AG2_SERVICE_TOKEN: "short",
}, { mode: "ai-container" });
assert.equal(aiWeakToken.ok, false);
assert.match(aiWeakToken.errors.join(" "), /at least 32/);

const aiHttpProduction = validateDeployEnv({
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
  AG2_SERVICE_URL: "http://agents.example.com",
  AG2_SERVICE_TOKEN: strongToken,
}, { mode: "ai-container" });
assert.equal(aiHttpProduction.ok, false);
assert.match(aiHttpProduction.errors.join(" "), /HTTPS/);

const aiLocal = validateDeployEnv({
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
  AG2_SERVICE_URL: "http://localhost:8000",
  AG2_SERVICE_TOKEN: strongToken,
  AI_AGENT_RATE_LIMIT_MAX: "20",
  AI_AGENT_RATE_LIMIT_WINDOW_MS: "60000",
}, { mode: "ai-container" });
assert.equal(aiLocal.ok, true);

const mismatchedFlags = validateDeployEnv({
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
}, { mode: "ai-container" });
assert.equal(mismatchedFlags.ok, false);
assert.match(mismatchedFlags.errors.join(" "), /enabled or disabled together/);

console.log("PASS deploy environment validation tests");
