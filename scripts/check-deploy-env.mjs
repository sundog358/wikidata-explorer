import { validateDeployEnv } from "../lib/deploy-env-validation.mjs";

function optionValue(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const mode = optionValue("mode", process.env.DEPLOY_ENV_MODE || "public-vercel");
const result = validateDeployEnv(process.env, { mode });

for (const warning of result.warnings) {
  console.warn(`WARN ${warning}`);
}

if (!result.ok) {
  for (const error of result.errors) {
    console.error(`FAIL ${error}`);
  }
  process.exit(1);
}

console.log(`PASS deploy environment check (${result.mode})`);
