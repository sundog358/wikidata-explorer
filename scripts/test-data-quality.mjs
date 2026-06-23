import assert from "node:assert/strict";
import { summarizeEntityDataQuality } from "../lib/data-quality.mjs";

const item = {
  id: "QTEST",
  statements: {
    P31: [
      {
        rank: "normal",
        references: [
          {
            hash: "r1",
            parts: [
              {
                property: { id: "P248", label: "stated in", data_type: "wikibase-item" },
                value: { type: "wikibase-item", content: { id: "Q455", label: "Encyclopaedia Britannica" } },
              },
              {
                property: { id: "P854", label: "reference URL", data_type: "url" },
                value: { type: "url", content: { value: "https://example.org/source" } },
              },
            ],
          },
        ],
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
assert.equal(summary.sourceHintCount, 2);
assert.equal(summary.sourceLinkCount, 2);
assert.equal(summary.sourceLinkedStatementCount, 1);
assert.equal(summary.sourceLinkCoverage, 1);
assert.equal(summary.rating, "Needs review");
assert.ok(summary.score > 0 && summary.score < 80);
assert.match(summary.issues.join(" "), /visible claim/);
assert.match(summary.issues.join(" "), /deprecated claim/);
assert.match(summary.strengths.join(" "), /references/);
assert.match(summary.strengths.join(" "), /source link/);

const itemWithoutSourceLinks = {
  id: "QNOURL",
  statements: {
    P31: [
      {
        rank: "normal",
        references: [{ hash: "r1", parts: [{ property: { id: "P813", label: "retrieved", data_type: "time" }, value: { type: "time", content: { time: "+2026-06-22T00:00:00Z" } } }] }],
        qualifiers: [],
      },
    ],
  },
};
const noLinksSummary = summarizeEntityDataQuality(itemWithoutSourceLinks);
assert.equal(noLinksSummary.sourceLinkCount, 0);
assert.equal(noLinksSummary.sourceLinkedStatementCount, 0);
assert.equal(noLinksSummary.sourceLinkCoverage, 0);
assert.match(noLinksSummary.issues.join(" "), /clickable source links/);

const empty = summarizeEntityDataQuality({ id: "QEMPTY", statements: {} });
assert.equal(empty.score, 0);
assert.equal(empty.rating, "Needs review");
assert.equal(empty.statementCount, 0);
assert.equal(empty.sourceHintCount, 0);
assert.equal(empty.sourceLinkCount, 0);
assert.match(empty.issues.join(" "), /No visible statements/);

console.log("PASS data quality tests");

