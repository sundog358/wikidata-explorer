import { spawnSync } from "node:child_process";
import { productionProofPlan } from "../lib/production-proof-plan.mjs";

function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

function optionValue(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const plan = productionProofPlan({
  baseUrl: optionValue("base-url", process.env.PRODUCTION_BASE_URL || ""),
  includeBrowser: !hasFlag("skip-browser"),
});

if (!plan.ok) {
  console.error("FAIL production proof requires an HTTPS base URL or localhost.");
  process.exit(1);
}

console.log(`Production proof target: ${plan.baseUrl}`);

for (const step of plan.commands) {
  console.log(`RUN ${step.id}: ${step.label}`);
  const command = step.command === "npm" && process.env.npm_execpath ? process.execPath : step.command;
  const args = step.command === "npm" && process.env.npm_execpath
    ? [process.env.npm_execpath, ...step.args]
    : step.args;
  const result = spawnSync(command, args, {
    env: { ...process.env, ...step.env },
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    if (result.error) console.error(`FAIL ${step.id} could not start: ${result.error.message}`);
    console.error(`FAIL ${step.id} exited with ${result.status}`);
    process.exit(result.status || 1);
  }
}

for (const evidence of plan.requiredExternalEvidence) {
  console.log(`EVIDENCE ${evidence}`);
}

console.log("PASS production proof checks");
