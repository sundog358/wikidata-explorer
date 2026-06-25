import assert from "node:assert/strict";
import { buildEntityComparison, buildEntityComparisonJsonExport, buildEntityComparisonMarkdownExport } from "../lib/entity-comparison.mjs";

const source = {
  id: "Q1",
  labels: { en: "Source item", fr: "Source" },
  descriptions: { en: "first item" },
  aliases: {},
  sitelinks: { enwiki: { title: "Source item", badges: [], url: "https://example.com/source" } },
  statements: {
    P31: [
      {
        id: "Q1$P31",
        rank: "normal",
        property: { id: "P31", label: "instance of", data_type: "wikibase-item" },
        value: { type: "wikibase-entityid", content: { id: "Q5", label: "human" } },
        qualifiers: [],
        references: [{ hash: "ref", parts: [] }],
      },
    ],
    P106: [
      {
        id: "Q1$P106",
        rank: "normal",
        property: { id: "P106", label: "occupation", data_type: "wikibase-item" },
        value: { type: "wikibase-entityid", content: { id: "Q36180", label: "writer" } },
        qualifiers: [],
        references: [],
      },
    ],
  },
};

const target = {
  id: "Q2",
  labels: { en: "Target item" },
  descriptions: { en: "second item" },
  aliases: {},
  sitelinks: {},
  statements: {
    P31: [
      {
        id: "Q2$P31",
        rank: "normal",
        property: { id: "P31", label: "instance of", data_type: "wikibase-item" },
        value: { type: "wikibase-entityid", content: { id: "Q5", label: "human" } },
        qualifiers: [{ property: { id: "P642", label: "of", data_type: "wikibase-item" }, value: { type: "wikibase-entityid", content: { id: "Q42", label: "Douglas Adams" } } }],
        references: [],
      },
    ],
    P27: [
      {
        id: "Q2$P27",
        rank: "normal",
        property: { id: "P27", label: "country of citizenship", data_type: "wikibase-item" },
        value: { type: "wikibase-entityid", content: { id: "Q145", label: "United Kingdom" } },
        qualifiers: [],
        references: [],
      },
    ],
  },
};

const comparison = buildEntityComparison(source, target, { createdAt: "2026-06-25T12:00:00.000Z" });

assert.equal(comparison.source.label, "Source item");
assert.equal(comparison.target.label, "Target item");
assert.equal(comparison.source.statementCount, 2);
assert.equal(comparison.target.qualifiedStatementCount, 1);
assert.equal(comparison.sharedProperties.length, 1);
assert.equal(comparison.sharedProperties[0].id, "P31");
assert.equal(comparison.sourceUniqueProperties[0].id, "P106");
assert.equal(comparison.targetUniqueProperties[0].id, "P27");
assert.equal(comparison.overlappingEntities[0].id, "Q5");

const markdown = buildEntityComparisonMarkdownExport(comparison);
assert.match(markdown, /Entity comparison: Source item \(Q1\) vs Target item \(Q2\)/);
assert.match(markdown, /Shared properties: 1/);
assert.match(markdown, /instance of \(P31\)/);
assert.match(markdown, /human \(Q5\)/);

const json = JSON.parse(buildEntityComparisonJsonExport(comparison));
assert.equal(json.generatedBy, "Wikidata Explorer");
assert.equal(json.artifactType, "entity-comparison");
assert.equal(json.source.url, "https://www.wikidata.org/wiki/Q1");
assert.equal(json.target.url, "https://www.wikidata.org/wiki/Q2");
assert.equal(json.summary.sharedPropertyCount, 1);
assert.equal(json.sharedProperties[0].id, "P31");
assert.equal(json.overlappingEntities[0].url, "https://www.wikidata.org/wiki/Q5");
assert.equal(json.safety.mode, "draft-only");

console.log("PASS entity comparison tests");
