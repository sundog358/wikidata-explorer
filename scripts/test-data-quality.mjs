import assert from "node:assert/strict";
import { summarizeEntityDataQuality } from "../lib/data-quality.mjs";

const item = {
  id: "QTEST",
  statements: {
    P31: [
      {
        rank: "normal",
        references: [{ hash: "r1", parts: [] }],
        qualifiers: [],
      },
      {
        rank: "preferred",
        references: [],
        qualifiers: [{ property: { id: "P580" }, value: { type: "time" } }],
      },
    ],
    P18: [
      {
        rank: "deprecated",
        references: [],
        qualifiers: [],
      },
    ],
  },
};

const summary = summarizeEntityDataQuality(item);
assert.equal(summary.statementCount, 3);
assert.equal(summary.propertyCount, 2);
assert.equal(summary.referencedStatementCount, 1);
assert.equal(summary.unreferencedStatementCount, 1);
assert.equal(summary.deprecatedStatementCount, 1);
assert.equal(summary.qualifiedStatementCount, 1);
assert.equal(summary.preferredStatementCount, 1);
assert.equal(summary.rating, "Needs review");
assert.ok(summary.score > 0 && summary.score < 80);
assert.match(summary.issues.join(" "), /visible claim/);
assert.match(summary.issues.join(" "), /deprecated claim/);
assert.match(summary.strengths.join(" "), /references/);

const empty = summarizeEntityDataQuality({ id: "QEMPTY", statements: {} });
assert.equal(empty.score, 0);
assert.equal(empty.rating, "Needs review");
assert.equal(empty.statementCount, 0);
assert.match(empty.issues.join(" "), /No visible statements/);

console.log("PASS data quality tests");
