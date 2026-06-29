import { runHostedAg2Proof } from "../lib/ag2-hosted-proof.mjs";

const result = await runHostedAg2Proof({ env: process.env });

if (result.ok) {
  console.log(`PASS hosted-ag2-targets app=${result.appBaseUrl} service=${result.ag2ServiceUrl}`);
}

for (const check of result.checks || []) {
  if (check.id === "ag2-demo-readiness") {
    console.log(`PASS ag2-demo-readiness checks=${check.checks?.length || 0}`);
  } else if (check.id === "grounded-entity-summary") {
    console.log(`PASS grounded-entity-summary route=${check.route} matched=${(check.matchedIds || []).join(",")}`);
  } else if (check.id === "observability-delivery") {
    const suffix = check.skipped
      ? `skipped=${check.reason}`
      : `durable=${check.durable} retainedEvents=${check.retainedEvents}`;
    console.log(`PASS observability-delivery ${suffix}`);
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

console.log(`PASS hosted AG2 proof (${result.appBaseUrl})`);
