import { runHostedOpsProof } from "../lib/hosted-ops-proof.mjs";

const result = await runHostedOpsProof({ env: process.env });

if (result.ok) {
  console.log(`PASS hosted-ops-target app=${result.baseUrl}`);
}

for (const check of result.checks || []) {
  if (check.id === "workspace-store") {
    console.log(`PASS workspace-store account=${check.accountId} project=${check.projectId} isolated=${check.isolated} tasks=${check.taskSummaryTotal} agentRuns=${check.agentSummaryTotal}`);
  } else if (check.id === "observability-receiver") {
    console.log(`PASS observability-receiver durable=${check.durable} retainedEvents=${check.retainedEvents}`);
  } else {
    console.log(`PASS ${check.id}`);
  }
}

if (!result.ok) {
  for (const error of result.errors || []) {
    console.error(`FAIL ${error}`);
  }
  process.exit(1);
}

console.log(`PASS hosted ops proof (${result.baseUrl})`);
