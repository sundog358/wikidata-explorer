import assert from "node:assert/strict";
import {
  collectRelationshipGraphNodes,
  filterRelationshipGraphNodes,
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
        references: [{ hash: "r1", parts: [] }],
      },
    ],
    P279: [
      {
        id: "s2",
        rank: "preferred",
        property: { id: "P279", label: "subclass of", data_type: "wikibase-item" },
        value: { type: "wikibase-entityid", content: { id: "P361", label: "part of" } },
        qualifiers: [{ property: { id: "P580", label: "start time", data_type: "time" }, value: { type: "time" } }],
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
assert.equal(nodes.length, 2);
assert.deepEqual(nodes.map((node) => node.id), ["Q5", "P361"]);
assert.equal(filterRelationshipGraphNodes(nodes, { kind: "item" }).length, 1);
assert.equal(filterRelationshipGraphNodes(nodes, { kind: "property" })[0].id, "P361");
assert.equal(filterRelationshipGraphNodes(nodes, { rank: "preferred" })[0].propertyId, "P279");
assert.equal(filterRelationshipGraphNodes(nodes, { evidence: "referenced" })[0].id, "Q5");
assert.equal(filterRelationshipGraphNodes(nodes, { evidence: "qualified" })[0].id, "P361");
assert.equal(filterRelationshipGraphNodes(nodes, { propertyId: "P31" })[0].label, "human");
assert.deepEqual(graphPropertyOptions(nodes).map((property) => property.id), ["P31", "P279"]);
assert.match(relationshipGraphSummary(item, nodes, filterRelationshipGraphNodes(nodes, { kind: "item" })), /1 of 2 relationships/);

console.log("PASS relationship graph filter tests");