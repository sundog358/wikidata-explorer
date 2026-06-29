import { execFileSync } from "node:child_process";
import { portfolioHostedPreflight } from "../lib/portfolio-hosted-preflight.mjs";

function optionValue(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

function repoFromRemote() {
  try {
    const remote = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim();
    const https = remote.match(/github\.com[:/](.+?)(?:\.git)?$/i);
    return https?.[1] || "";
  } catch {
    return "";
  }
}

function githubSecretNames(repo) {
  const output = execFileSync("gh", ["secret", "list", "--repo", repo, "--json", "name"], { encoding: "utf8" });
  const parsed = JSON.parse(output || "[]");
  return Array.isArray(parsed) ? parsed.map((item) => item.name).filter(Boolean) : [];
}

const env = { ...process.env };
const appBaseUrl = optionValue("app-base-url");
const opsBaseUrl = optionValue("ops-base-url");
const ag2ServiceUrl = optionValue("ag2-service-url");
const scope = optionValue("scope", "all");
if (appBaseUrl) {
  env.AG2_DEMO_BASE_URL = appBaseUrl;
  env.NEXT_PUBLIC_SITE_URL ||= appBaseUrl;
}
if (opsBaseUrl) env.HOSTED_OPS_BASE_URL = opsBaseUrl;
if (ag2ServiceUrl) env.AG2_SERVICE_URL = ag2ServiceUrl;

const requireGithubSecrets = hasFlag("github");
const mode = hasFlag("all") ? "all" : requireGithubSecrets ? "github-actions" : "local";
const repo = optionValue("repo", process.env.GITHUB_REPOSITORY || repoFromRemote());
let secretNames = [];
const errors = [];

if (requireGithubSecrets) {
  if (!repo) {
    errors.push("Could not determine GitHub repository; pass --repo=owner/name.");
  } else {
    try {
      secretNames = githubSecretNames(repo);
    } catch (error) {
      errors.push(`Could not read GitHub Actions secret metadata for ${repo}: ${error?.message || error}`);
    }
  }
}

const result = portfolioHostedPreflight({
  env,
  mode,
  scope,
  requireGithubSecrets,
  githubSecretNames: secretNames,
  repo,
  publicAppUrl: opsBaseUrl || env.PRODUCTION_BASE_URL || "https://www.wikidataexplorer.com",
});

for (const check of result.checks) {
  const prefix = check.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${check.id} ${check.message}`);
}

for (const warning of result.warnings) {
  console.warn(`WARN ${warning}`);
}

const failedCheckMessages = new Set(result.checks.filter((check) => !check.ok).map((check) => check.message));
for (const error of [...errors, ...result.errors].filter((message) => !failedCheckMessages.has(message))) {
  console.error(`FAIL ${error}`);
}

if (errors.length > 0 || !result.ok) {
  if (result.nextActions.length) {
    console.error("NEXT hosted proof setup actions:");
    for (const action of result.nextActions) console.error(`NEXT ${action}`);
  }
  process.exit(1);
}

console.log("PASS portfolio hosted preflight");
