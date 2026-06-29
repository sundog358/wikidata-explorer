import { ag2DemoReadinessStaticReport } from "./ag2-demo-readiness.mjs";
import { hostedAg2ProofConfig } from "./ag2-hosted-proof.mjs";
import { hostedOpsProofConfig } from "./hosted-ops-proof.mjs";

export const REQUIRED_PORTFOLIO_GITHUB_SECRETS = Object.freeze([
  "PRODUCTION_WORKSPACE_STORE_TOKEN",
  "PRODUCTION_OBSERVABILITY_RECEIVER_TOKEN",
  "AG2_DEMO_SERVICE_TOKEN",
  "AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN",
]);

const REQUIRED_SECRETS_BY_SCOPE = Object.freeze({
  ops: Object.freeze([
    "PRODUCTION_WORKSPACE_STORE_TOKEN",
    "PRODUCTION_OBSERVABILITY_RECEIVER_TOKEN",
  ]),
  ag2: Object.freeze([
    "AG2_DEMO_SERVICE_TOKEN",
    "AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN",
  ]),
  all: REQUIRED_PORTFOLIO_GITHUB_SECRETS,
});

function cleanOneLine(value = "", maxLength = 240) {
  return String(value ?? "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function valueFrom(env, keys) {
  for (const key of keys) {
    const value = cleanOneLine(env[key], 500);
    if (value) return value;
  }
  return "";
}

function safeUrl(value) {
  const raw = cleanOneLine(value, 500);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function isPlaceholderUrl(value) {
  const raw = cleanOneLine(value, 500).toLowerCase();
  return raw.includes("replace-with") || raw.includes("example.com");
}

function appendMessages(target, messages = [], prefix) {
  for (const message of messages) {
    target.push(prefix ? `${prefix}: ${message}` : message);
  }
}

function check(id, ok, message, details = {}) {
  return { id, ok: Boolean(ok), message, ...details };
}

function ag2ReadinessEnv(env, config) {
  const appBaseUrl = safeUrl(config.appBaseUrl || env.AG2_DEMO_BASE_URL || env.AI_DEMO_BASE_URL || env.NEXT_PUBLIC_SITE_URL);
  const observabilityToken = cleanOneLine(config.observabilityToken || valueFrom(env, [
    "AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN",
    "API_OBSERVABILITY_RECEIVER_TOKEN",
    "API_OBSERVABILITY_WEBHOOK_TOKEN",
  ]), 500);
  const webhookUrl = cleanOneLine(env.API_OBSERVABILITY_WEBHOOK_URL, 500) ||
    (appBaseUrl && observabilityToken ? new URL("/api/observability/events", appBaseUrl).toString() : "");

  return {
    ...env,
    NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL || appBaseUrl,
    API_OBSERVABILITY_WEBHOOK_URL: webhookUrl,
    API_OBSERVABILITY_WEBHOOK_TOKEN: env.API_OBSERVABILITY_WEBHOOK_TOKEN || observabilityToken,
    API_OBSERVABILITY_RECEIVER_TOKEN: env.API_OBSERVABILITY_RECEIVER_TOKEN || observabilityToken,
  };
}

function requiredSecretsForScope(scope = "all") {
  return REQUIRED_SECRETS_BY_SCOPE[scope] || REQUIRED_SECRETS_BY_SCOPE.all;
}

function hostedProofNextActions(options = {}) {
  const scope = options.scope || "all";
  const repo = cleanOneLine(options.repo, 120) || "<owner/repo>";
  const publicAppUrl = cleanOneLine(options.publicAppUrl, 160) || "https://www.wikidataexplorer.com";
  const rawAiAppUrl = cleanOneLine(options.aiAppUrl, 160);
  const rawAg2ServiceUrl = cleanOneLine(options.ag2ServiceUrl, 160);
  const aiAppUrl = rawAiAppUrl && !isPlaceholderUrl(rawAiAppUrl) ? rawAiAppUrl : "<ai-enabled-next-app-url>";
  const ag2ServiceUrl = rawAg2ServiceUrl && !isPlaceholderUrl(rawAg2ServiceUrl) ? rawAg2ServiceUrl : "<hosted-ag2-service-url>";
  const actions = [];

  if (["ops", "all"].includes(scope)) {
    actions.push(`gh secret set PRODUCTION_WORKSPACE_STORE_TOKEN --repo ${repo}`);
    actions.push(`gh secret set PRODUCTION_OBSERVABILITY_RECEIVER_TOKEN --repo ${repo}`);
  }
  if (["ag2", "all"].includes(scope)) {
    actions.push(`gh secret set AG2_DEMO_SERVICE_TOKEN --repo ${repo}`);
    actions.push(`gh secret set AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN --repo ${repo}`);
    actions.push(`Set AG2_SERVICE_URL to a real HTTPS AG2 service URL such as ${ag2ServiceUrl}.`);
  }

  actions.push(`npm run portfolio:hosted:preflight -- --github --app-base-url=${aiAppUrl} --ag2-service-url=${ag2ServiceUrl}`);
  if (scope === "all") {
    actions.push(`gh workflow run production-proof.yml --repo ${repo} -f base_url=${publicAppUrl} -f skip_browser=false -f run_ops_proof=true -f run_ag2_proof=true -f ai_app_base_url=${aiAppUrl} -f ag2_service_url=${ag2ServiceUrl} -f require_ag2_durable_monitor=true`);
    actions.push("npm run portfolio:10:check -- --dir=<artifact-dir> --require-check-log");
  }

  return actions;
}

function githubSecretChecks(secretNames = [], scope = "all") {
  const present = new Set(secretNames.map((name) => cleanOneLine(name)).filter(Boolean));
  return requiredSecretsForScope(scope).map((name) => check(
    `github-secret:${name}`,
    present.has(name),
    present.has(name)
      ? `${name} is configured in GitHub Actions.`
      : `${name} is missing from GitHub Actions secrets.`,
    { name },
  ));
}

export function portfolioHostedPreflight(options = {}) {
  const env = options.env || {};
  const mode = options.mode || (options.requireGithubSecrets ? "github-actions" : "local");
  const scope = options.scope || "all";
  const checks = [];
  const errors = [];
  const warnings = [];
  const checkLocal = mode === "local" || mode === "all";
  const checkGithub = mode === "github-actions" || mode === "all" || options.requireGithubSecrets;

  if (!["local", "github-actions", "all"].includes(mode)) {
    errors.push(`Unknown portfolio hosted preflight mode ${JSON.stringify(mode)}.`);
  }
  if (!["ops", "ag2", "all"].includes(scope)) {
    errors.push(`Unknown portfolio hosted preflight scope ${JSON.stringify(scope)}.`);
  }

  if (checkLocal && ["ops", "all"].includes(scope)) {
    const opsConfig = hostedOpsProofConfig(env);
    checks.push(check(
      "hosted-ops-proof-env",
      opsConfig.ok,
      opsConfig.ok
        ? "Hosted ops proof has the base URL and bearer tokens it needs."
        : "Hosted ops proof is missing required base URL or bearer-token inputs.",
    ));
    if (!opsConfig.ok) appendMessages(errors, opsConfig.errors, "hosted ops");

    if (!cleanOneLine(env.HOSTED_OPS_BASE_URL) && !cleanOneLine(env.PRODUCTION_BASE_URL)) {
      warnings.push("HOSTED_OPS_BASE_URL/PRODUCTION_BASE_URL is not set; hosted ops proof will default to https://www.wikidataexplorer.com.");
    }

  }

  if (checkLocal && ["ag2", "all"].includes(scope)) {
    const ag2Config = hostedAg2ProofConfig(env);
    checks.push(check(
      "hosted-ag2-proof-env",
      ag2Config.ok,
      ag2Config.ok
        ? "Hosted AG2 proof has the app URL and observability receiver token it needs."
        : "Hosted AG2 proof is missing required app URL or observability receiver inputs.",
    ));
    if (!ag2Config.ok) appendMessages(errors, ag2Config.errors, "hosted AG2");

    const readiness = ag2DemoReadinessStaticReport(ag2ReadinessEnv(env, ag2Config));
    checks.push(check(
      "ag2-demo-static-readiness",
      readiness.ok,
      readiness.ok
        ? "AI-enabled demo environment passes static readiness checks."
        : "AI-enabled demo environment is not ready for hosted proof.",
      { readinessChecks: readiness.checks.map((item) => ({ id: item.id, ok: item.ok, severity: item.severity })) },
    ));
    if (!readiness.ok) appendMessages(errors, readiness.errors, "AG2 readiness");
    appendMessages(warnings, readiness.warnings, "AG2 readiness");
  }

  if (checkGithub) {
    const secretChecks = githubSecretChecks(options.githubSecretNames || [], scope);
    checks.push(...secretChecks);
    for (const item of secretChecks) {
      if (!item.ok) errors.push(item.message);
    }
  }

  if (["ag2", "all"].includes(scope)) {
    const ag2ServiceUrl = safeUrl(valueFrom(env, ["AG2_SERVICE_URL", "ag2_service_url"]));
    if (!ag2ServiceUrl) {
      errors.push("AG2_SERVICE_URL must be set to the hosted AG2 service URL before running final hosted AG2 proof.");
    } else if (isPlaceholderUrl(ag2ServiceUrl)) {
      errors.push("AG2_SERVICE_URL must be a real hosted AG2 service URL, not an example or placeholder URL.");
    }

    const appBaseUrl = safeUrl(valueFrom(env, ["AG2_DEMO_BASE_URL", "AI_DEMO_BASE_URL", "NEXT_PUBLIC_SITE_URL"]));
    if (!appBaseUrl) {
      errors.push("AG2_DEMO_BASE_URL, AI_DEMO_BASE_URL, or NEXT_PUBLIC_SITE_URL must identify the AI-enabled hosted Next app.");
    } else if (isPlaceholderUrl(appBaseUrl)) {
      errors.push("The AI-enabled hosted app URL must be real, not an example or placeholder URL.");
    }
  }

  return {
    ok: errors.length === 0,
    mode,
    scope,
    checks,
    errors,
    warnings,
    nextActions: hostedProofNextActions({
      scope,
      repo: options.repo,
      publicAppUrl: options.publicAppUrl,
      aiAppUrl: valueFrom(env, ["AG2_DEMO_BASE_URL", "AI_DEMO_BASE_URL", "NEXT_PUBLIC_SITE_URL"]),
      ag2ServiceUrl: valueFrom(env, ["AG2_SERVICE_URL", "ag2_service_url"]),
    }),
    requiredCommands: [
      "npm run production:proof",
      "npm run ops:proof",
      "npm run ag2:hosted:proof",
      "npm run portfolio:10:check -- --dir=<artifact-dir> --require-check-log",
    ],
  };
}
