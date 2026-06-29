import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { portfolioHostedPreflight, REQUIRED_PORTFOLIO_GITHUB_SECRETS } from "../lib/portfolio-hosted-preflight.mjs";

const strongToken = "hosted-proof-token-value-with-32-plus-chars";

const missing = portfolioHostedPreflight({ env: {} });
assert.equal(missing.ok, false);
assert.match(missing.errors.join(" "), /WORKSPACE_STORE_TOKEN/);
assert.match(missing.errors.join(" "), /AG2_SERVICE_URL/);
assert.match(missing.errors.join(" "), /AG2_DEMO_BASE_URL/);

const completeEnv = {
  HOSTED_OPS_BASE_URL: "https://www.wikidataexplorer.com",
  WORKSPACE_STORE_TOKEN: "workspace-token-value",
  API_OBSERVABILITY_RECEIVER_TOKEN: "receiver-token-value",
  AG2_DEMO_BASE_URL: "https://ai.wikidataexplorer.com",
  NEXT_PUBLIC_SITE_URL: "https://ai.wikidataexplorer.com",
  NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
  ENABLE_AI_AGENTS: "true",
  AG2_SERVICE_URL: "https://ag2.wikidataexplorer.com",
  AG2_SERVICE_TOKEN: strongToken,
  AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN: "receiver-token-value",
  API_OBSERVABILITY_WEBHOOK_URL: "https://ai.wikidataexplorer.com/api/observability/events",
  API_OBSERVABILITY_WEBHOOK_TOKEN: "receiver-token-value",
  AI_AGENT_RATE_LIMIT_MAX: "20",
  AI_AGENT_RATE_LIMIT_WINDOW_MS: "60000",
  AG2_ENABLE_DOCS: "false",
};

const complete = portfolioHostedPreflight({
  env: completeEnv,
  mode: "all",
  scope: "all",
  requireGithubSecrets: true,
  githubSecretNames: REQUIRED_PORTFOLIO_GITHUB_SECRETS,
});
assert.equal(complete.ok, true);
assert.equal(complete.checks.filter((item) => item.ok).length, complete.checks.length);
assert.ok(complete.requiredCommands.includes("npm run portfolio:10:check -- --dir=<artifact-dir> --require-check-log"));
assert.ok(complete.nextActions.some((action) => action.includes("gh workflow run production-proof.yml")));
assert.ok(complete.nextActions.some((action) => action.includes("npm run portfolio:10:check -- --dir=<artifact-dir> --require-check-log")));

const githubMissing = portfolioHostedPreflight({
  env: {
    AG2_DEMO_BASE_URL: "https://ai.wikidataexplorer.com",
    AG2_SERVICE_URL: "https://ag2.wikidataexplorer.com",
  },
  mode: "github-actions",
  scope: "all",
  requireGithubSecrets: true,
  githubSecretNames: ["PRODUCTION_WORKSPACE_STORE_TOKEN"],
});
assert.equal(githubMissing.ok, false);
assert.match(githubMissing.errors.join(" "), /AG2_DEMO_SERVICE_TOKEN/);
assert.ok(githubMissing.nextActions.some((action) => action.includes("gh secret set AG2_DEMO_SERVICE_TOKEN --repo <owner/repo>")));

const githubReady = portfolioHostedPreflight({
  env: {
    AG2_DEMO_BASE_URL: "https://ai.wikidataexplorer.com",
    AG2_SERVICE_URL: "https://ag2.wikidataexplorer.com",
  },
  mode: "github-actions",
  scope: "all",
  requireGithubSecrets: true,
  githubSecretNames: REQUIRED_PORTFOLIO_GITHUB_SECRETS,
});
assert.equal(githubReady.ok, true);

const opsOnly = portfolioHostedPreflight({
  env: {
    HOSTED_OPS_BASE_URL: "https://www.wikidataexplorer.com",
    WORKSPACE_STORE_TOKEN: "workspace-token-value",
    API_OBSERVABILITY_RECEIVER_TOKEN: "receiver-token-value",
  },
  scope: "ops",
});
assert.equal(opsOnly.ok, true);
assert.ok(!opsOnly.errors.join(" ").includes("AG2_SERVICE_URL"));

const ag2Only = portfolioHostedPreflight({
  env: {
    AG2_DEMO_BASE_URL: "https://ai.wikidataexplorer.com",
    NEXT_PUBLIC_SITE_URL: "https://ai.wikidataexplorer.com",
    NEXT_PUBLIC_ENABLE_AI_AGENTS: "true",
    ENABLE_AI_AGENTS: "true",
    AG2_SERVICE_URL: "https://ag2.wikidataexplorer.com",
    AG2_SERVICE_TOKEN: strongToken,
    AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN: "receiver-token-value",
    API_OBSERVABILITY_WEBHOOK_URL: "https://ai.wikidataexplorer.com/api/observability/events",
    API_OBSERVABILITY_WEBHOOK_TOKEN: "receiver-token-value",
    AI_AGENT_RATE_LIMIT_MAX: "20",
    AI_AGENT_RATE_LIMIT_WINDOW_MS: "60000",
  },
  scope: "ag2",
});
assert.equal(ag2Only.ok, true);
assert.ok(!ag2Only.errors.join(" ").includes("WORKSPACE_STORE_TOKEN"));

const githubPlaceholder = portfolioHostedPreflight({
  env: {
    AG2_DEMO_BASE_URL: "https://www.wikidataexplorer.com",
    AG2_SERVICE_URL: "https://replace-with-hosted-ag2.example.com",
  },
  mode: "github-actions",
  scope: "all",
  requireGithubSecrets: true,
  githubSecretNames: REQUIRED_PORTFOLIO_GITHUB_SECRETS,
});
assert.equal(githubPlaceholder.ok, false);
assert.match(githubPlaceholder.errors.join(" "), /not an example or placeholder/);
assert.ok(githubPlaceholder.nextActions.every((action) => !action.includes("replace-with-hosted-ag2.example.com")));
assert.ok(githubPlaceholder.nextActions.some((action) => action.includes("<hosted-ag2-service-url>")));

const noSecretValues = JSON.stringify(githubMissing);
assert.doesNotMatch(noSecretValues, /hosted-proof-token-value/);
assert.doesNotMatch(noSecretValues, /workspace-token-value/);
assert.doesNotMatch(noSecretValues, /receiver-token-value/);

const cliMissing = spawnSync(process.execPath, [
  "scripts/check-portfolio-hosted-preflight.mjs",
  "--repo=sundog358/wikidata-explorer",
  "--app-base-url=https://www.wikidataexplorer.com",
  "--ag2-service-url=https://replace-with-hosted-ag2.example.com",
], {
  cwd: new URL("..", import.meta.url),
  encoding: "utf8",
});
assert.notEqual(cliMissing.status, 0);
assert.match(cliMissing.stderr, /NEXT hosted proof setup actions:/);
assert.match(cliMissing.stderr, /NEXT gh secret set PRODUCTION_WORKSPACE_STORE_TOKEN --repo sundog358\/wikidata-explorer/);
assert.match(cliMissing.stderr, /NEXT gh workflow run production-proof\.yml --repo sundog358\/wikidata-explorer/);
assert.match(cliMissing.stderr, /--require-check-log/);
assert.doesNotMatch(cliMissing.stderr, /replace-with-hosted-ag2\.example\.com/);

console.log("PASS portfolio hosted preflight tests");
