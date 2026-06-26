import { ag2DemoReadinessReport } from "../lib/ag2-demo-readiness.mjs";

function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

const report = await ag2DemoReadinessReport(process.env, {
  health: hasFlag("health"),
});

for (const item of report.checks) {
  const prefix = item.ok ? "PASS" : item.severity === "info" ? "INFO" : "FAIL";
  console.log(`${prefix} ${item.id}: ${item.message}`);
}

for (const warning of report.warnings) {
  console.warn(`WARN ${warning}`);
}

if (!report.ok) {
  for (const error of report.errors) {
    console.error(`FAIL ${error}`);
  }
  process.exit(1);
}

console.log("PASS AG2 demo readiness check");
