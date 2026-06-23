import assert from "node:assert/strict";
import { validateDeployEnv } from "../lib/deploy-env-validation.mjs";

const strongToken = "deploy-token-value-with-32-plus-chars";

const publicMissingSiteUrl = validateDeployEnv({}, { mode: "public-vercel" });
assert.equal(publicMissingSiteUrl.ok, true);
assert.match(publicMissingSiteUrl.warnings.join(" "), /NEXT_PUBLIC_SITE_URL/);

const publicHttpsSiteUrl = validateDeployEnv({
  NEXT_PUBLIC_SITE_URL: "https://wikidata-explorer.example.com",
}, { mode: "public-vercel" });
assert.equal(publicHttpsSiteUrl.ok, true);
assert.doesNotMatch(publicHttpsSiteUrl.warnings.join(" "), /metadata.*localhost/);

const publicLocalSiteUrl = validateDeployEnv({
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
}, { mode: "public-vercel" });
assert.equal(publicLocalSiteUrl.ok, true);

const publicVercelFallback = validateDeployEnv({
  VERCEL_URL: "wikidata-explorer.vercel.app",
}, { mode: "public-vercel" });
assert.equal(publicVercelFallback.ok, true);
assert.match(publicVercelFallback.warnings.join(" "), /Vercel-provided URL/);

const publicHttpSiteUrl = validateDeployEnv({
  NEXT_PUBLIC_SITE_URL: "http://wikidata-explorer.example.com",
}, { mode: "public-vercel" });
assert.equal(publicHttpSiteUrl.ok, false);
assert.match(publicHttpSiteUrl.errors.join(" "), /NEXT_PUBLIC_SITE_URL/);

const publicAiOn = validateDeployEnv({
  NEXT_PUBLIC_SITE_URL: "https://wikidata-explorer.example.com",
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
}, { mode: "public-vercel" });
assert.equal(publicAiOn.ok, false);
assert.match(publicAiOn.errors.join(" "), /Public Vercel deploy/);

const publicWithKey = validateDeployEnv({
  NEXT_PUBLIC_SITE_URL: "https://wikidata-explorer.example.com",
  OPENAI_API_KEY: "sk-test",
}, { mode: "public-vercel" });
assert.equal(publicWithKey.ok, true);
assert.match(publicWithKey.warnings.join(" "), /not needed/);

const aiMissingService = validateDeployEnv({
  NEXT_PUBLIC_SITE_URL: "https://wikidata-explorer.example.com",
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
  AG2_SERVICE_TOKEN: strongToken,
}, { mode: "ai-container" });
assert.equal(aiMissingService.ok, false);
assert.match(aiMissingService.errors.join(" "), /AG2_SERVICE_URL/);

const aiWeakToken = validateDeployEnv({
  NEXT_PUBLIC_SITE_URL: "https://wikidata-explorer.example.com",
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
  AG2_SERVICE_URL: "https://agents.example.com",
  AG2_SERVICE_TOKEN: "short",
}, { mode: "ai-container" });
assert.equal(aiWeakToken.ok, false);
assert.match(aiWeakToken.errors.join(" "), /at least 32/);

const aiHttpProduction = validateDeployEnv({
  NEXT_PUBLIC_SITE_URL: "https://wikidata-explorer.example.com",
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
  AG2_SERVICE_URL: "http://agents.example.com",
  AG2_SERVICE_TOKEN: strongToken,
}, { mode: "ai-container" });
assert.equal(aiHttpProduction.ok, false);
assert.match(aiHttpProduction.errors.join(" "), /HTTPS/);

const aiLocal = validateDeployEnv({
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
  AG2_SERVICE_URL: "http://localhost:8000",
  AG2_SERVICE_TOKEN: strongToken,
  AI_AGENT_RATE_LIMIT_MAX: "20",
  AI_AGENT_RATE_LIMIT_WINDOW_MS: "60000",
}, { mode: "ai-container" });
assert.equal(aiLocal.ok, true);

const mismatchedFlags = validateDeployEnv({
  NEXT_PUBLIC_SITE_URL: "https://wikidata-explorer.example.com",
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
}, { mode: "ai-container" });
assert.equal(mismatchedFlags.ok, false);
assert.match(mismatchedFlags.errors.join(" "), /enabled or disabled together/);

console.log("PASS deploy environment validation tests");
