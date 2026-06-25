import assert from "node:assert/strict";
import {
  collectRelationshipGraphNodes,
  filterRelationshipGraphNodes,
  graphFocusFromNode,
  relationshipEvidenceSummary,
  graphPropertyOptions,
  relationshipGraphSummary,
} from "../lib/relationship-graph-utils.mjs";

const item = {
  id: "QTEST",
  labels: { en: "Test entity" },
  statements: {
    P31: [
      {
        id: "s1",
        rank: "normal",
        property: { id: "P31", label: "instance of", data_type: "wikibase-item" },
        value: { type: "wikibase-entityid", content: { id: "Q5", label: "human" } },
        qualifiers: [],
        references: [{ hash: "r1", parts: [{ property: { id: "P248", label: "stated in", data_type: "wikibase-item" }, value: { type: "wikibase-entityid", content: { id: "Q1", label: "Source record" } } }] }],
      },
    ],
    P279: [
      {
        id: "s2",
        rank: "preferred",
        property: { id: "P279", label: "subclass of", data_type: "wikibase-item" },
        value: { type: "wikibase-entityid", content: { id: "P361", label: "part of" } },
        qualifiers: [{ property: { id: "P580", label: "start time", data_type: "time" }, value: { type: "time", content: { time: "+1952-03-11T00:00:00Z" } } }],
        references: [],
      },
    ],
    P18: [
      {
        id: "s3",
        rank: "normal",
        property: { id: "P18", label: "image", data_type: "commonsMedia" },
        value: { type: "commonsMedia", content: { value: "Example.jpg" } },
        qualifiers: [],
        references: [],
      },
    ],
  },
};

const nodes = collectRelationshipGraphNodes(item);
assert.equal(nodes.length, 3);
assert.deepEqual(nodes.map((node) => node.id), ["Q5", "Q1", "P361"]);
assert.deepEqual(nodes.map((node) => node.depth), [1, 2, 1]);
assert.equal(filterRelationshipGraphNodes(nodes, { kind: "item" }).length, 1);
assert.deepEqual(filterRelationshipGraphNodes(nodes, { depth: "1" }).map((node) => node.id), ["Q5", "P361"]);
assert.deepEqual(filterRelationshipGraphNodes(nodes, { depth: "2" }).map((node) => node.id), ["Q5", "Q1", "P361"]);
assert.deepEqual(filterRelationshipGraphNodes(nodes, { depth: "property", propertyId: "P31" }).map((node) => node.id), ["Q5", "Q1"]);
assert.equal(filterRelationshipGraphNodes(nodes, { kind: "property" })[0].id, "P361");
assert.equal(filterRelationshipGraphNodes(nodes, { rank: "preferred" })[0].propertyId, "P279");
assert.deepEqual(filterRelationshipGraphNodes(nodes, { depth: "2", evidence: "referenced" }).map((node) => node.id), ["Q5", "Q1"]);
assert.equal(filterRelationshipGraphNodes(nodes, { evidence: "qualified" })[0].id, "P361");
assert.equal(filterRelationshipGraphNodes(nodes, { propertyId: "P31" })[0].label, "human");
assert.deepEqual(graphPropertyOptions(nodes).map((property) => property.id), ["P31", "P279"]);
assert.deepEqual(graphFocusFromNode(nodes[0]), {
  id: "Q5",
  label: "human",
  property: "instance of",
  propertyId: "P31",
  sourceProperty: "instance of",
  sourcePropertyId: "P31",
  kind: "item",
  rank: "normal",
  dataType: "wikibase-item",
  qualifierCount: 0,
  referenceCount: 1,
  depth: 1,
  source: "statement",
  statementId: "s1",
  value: "human (Q5)",
  evidenceSummary: {
    qualifiers: [],
    references: ["stated in: Source record Q1"],
    qualifierOverflow: 0,
    referenceOverflow: 0,
  },
});
assert.match(relationshipGraphSummary(item, nodes, filterRelationshipGraphNodes(nodes, { kind: "item" })), /1 of 3 relationships/);
assert.deepEqual(relationshipEvidenceSummary(nodes[0]), {
  qualifiers: [],
  references: ["stated in: Source record Q1"],
  qualifierOverflow: 0,
  referenceOverflow: 0,
});
const propertyNode = nodes.find((node) => node.id === "P361");
assert.ok(propertyNode);
assert.deepEqual(relationshipEvidenceSummary(propertyNode, 0), {
  qualifiers: [],
  references: [],
  qualifierOverflow: 1,
  referenceOverflow: 0,
});
assert.deepEqual(relationshipEvidenceSummary(propertyNode).qualifiers, ["start time: 1952-03-11"]);

console.log("PASS relationship graph filter tests");
