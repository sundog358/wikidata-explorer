import assert from "node:assert/strict";
import { productionProofPlan } from "../lib/production-proof-plan.mjs";

const fullPlan = productionProofPlan({ baseUrl: "https://www.wikidataexplorer.com/" });
assert.equal(fullPlan.ok, true);
assert.equal(fullPlan.baseUrl, "https://www.wikidataexplorer.com");
assert.deepEqual(fullPlan.commands.map((step) => step.id), ["metadata", "smoke", "homepage-proof", "search-proof"]);
assert.equal(fullPlan.commands.find((step) => step.id === "metadata").env.METADATA_BASE_URL, fullPlan.baseUrl);
assert.equal(fullPlan.commands.find((step) => step.id === "smoke").env.SMOKE_BASE_URL, fullPlan.baseUrl);
assert.equal(fullPlan.commands.find((step) => step.id === "search-proof").env.E2E_BASE_URL, fullPlan.baseUrl);
assert.ok(fullPlan.requiredExternalEvidence.some((item) => item.includes("GitHub Actions CI")));
assert.ok(fullPlan.requiredExternalEvidence.some((item) => item.includes("Vercel")));

const fastPlan = productionProofPlan({ baseUrl: "http://localhost:3001", includeBrowser: false });
assert.equal(fastPlan.ok, true);
assert.equal(fastPlan.baseUrl, "http://localhost:3001");
assert.deepEqual(fastPlan.commands.map((step) => step.id), ["metadata", "smoke"]);

const invalidPlan = productionProofPlan({ baseUrl: "http://example.com" });
assert.equal(invalidPlan.ok, false);
assert.equal(invalidPlan.baseUrl, "");

console.log("PASS production proof plan tests");
