import assert from "node:assert/strict";
import { buildGraphPathJsonExport, buildGraphPathMarkdownExport } from "../lib/graph-path-export.mjs";

const source = { entityId: "Q42", entityLabel: "Douglas Adams" };
const focus = {
  id: "Q5",
  label: "human",
  property: "instance of",
  propertyId: "P31",
  kind: "item",
  rank: "normal",
  dataType: "wikibase-item",
  qualifierCount: 1,
  referenceCount: 2,
  statementId: "Q42$abc",
  value: "human (Q5)",
};
const createdAt = "2026-06-23T12:00:00.000Z";

const markdown = buildGraphPathMarkdownExport(source, focus, { createdAt });
assert.match(markdown, /^# Wikidata Graph Path: Douglas Adams \(Q42\)/);
assert.match(markdown, /Generated: 2026-06-23T12:00:00.000Z/);
assert.match(markdown, /Relationship: instance of \(P31\)/);
assert.match(markdown, /Target: \[human \(Q5\)\]/);
assert.match(markdown, /Evidence: 2 references; 1 qualifier/);
assert.match(markdown, /Run the graph, verifier, or report AG2 specialist agent/);

const json = JSON.parse(buildGraphPathJsonExport(source, focus, { createdAt }));
assert.equal(json.artifactType, "selected-graph-path");
assert.equal(json.source.id, "Q42");
assert.equal(json.edge.propertyId, "P31");
assert.equal(json.edge.referenceCount, 2);
assert.equal(json.target.id, "Q5");
assert.equal(json.safety.mode, "draft-only");

const empty = buildGraphPathMarkdownExport(source, null, { createdAt });
assert.match(empty, /No selected graph relationship was available for export/);

console.log("PASS graph path export tests");
