import assert from "node:assert/strict";
import { summarizeEntityDataQuality } from "../lib/data-quality.mjs";
import { buildEntityComparison, buildEntityComparisonJsonExport } from "../lib/entity-comparison.mjs";
import {
  collectRelationshipGraphNodes,
  filterRelationshipGraphNodes,
  graphFocusFromNode,
  graphPropertyOptions,
  relationshipEvidenceSummary,
} from "../lib/relationship-graph-utils.mjs";
import { sourceHintsFromStatement } from "../lib/review-source-hints.mjs";
import { fixtureDetailedEntity, fixtureEntityIds, fixtureSearchWikidata } from "./fixtures/wikidata-fixtures.mjs";

assert.deepEqual(fixtureEntityIds().sort(), ["P31", "Q42", "Q80"]);

const douglasResults = fixtureSearchWikidata("Douglas Adams");
assert.equal(douglasResults.length, 1);
assert.equal(douglasResults[0].id, "Q42");
assert.equal(douglasResults[0].type, "item");
assert.deepEqual(douglasResults[0].statements, {});

const propertyResults = fixtureSearchWikidata("instance of");
assert.equal(propertyResults[0].id, "P31");
assert.equal(propertyResults[0].type, "property");

const source = fixtureDetailedEntity("Q42");
const target = fixtureDetailedEntity("Q80");
assert.equal(source.labels.en, "Douglas Adams");
assert.equal(source.aliases.en.includes("DNA"), true);
assert.equal(source.sitelinks.enwiki.url, "https://en.wikipedia.org/wiki/Douglas_Adams");
assert.throws(() => fixtureDetailedEntity("Q999999999"), /No fixture Wikidata entity/);

const q42GraphNodes = collectRelationshipGraphNodes(source);
assert.ok(q42GraphNodes.length >= 5);
assert.ok(q42GraphNodes.some((node) => node.id === "Q5" && node.propertyId === "P31"));
assert.ok(q42GraphNodes.some((node) => node.id === "Q5375741" && node.depth === 2));
assert.deepEqual(graphPropertyOptions(q42GraphNodes).map((property) => property.id).sort(), ["P106", "P31", "P569", "P800"]);
assert.deepEqual(filterRelationshipGraphNodes(q42GraphNodes, { depth: "property", propertyId: "P31" }).map((node) => node.id), ["Q5", "Q5375741"]);
assert.equal(filterRelationshipGraphNodes(q42GraphNodes, { evidence: "referenced" }).some((node) => node.propertyId === "P800"), true);
assert.equal(filterRelationshipGraphNodes(q42GraphNodes, { depth: "2", evidence: "qualified" })[0].sourcePropertyId, "P569");

const q5Node = q42GraphNodes.find((node) => node.id === "Q5");
assert.ok(q5Node);
assert.deepEqual(relationshipEvidenceSummary(q5Node).references, ["stated in: Encyclopaedia Britannica Online Q5375741; retrieved: 2024-01-01"]);
assert.equal(graphFocusFromNode(q5Node).statementId, "Q42$fixture-P31-Q5");

const qualitySummary = summarizeEntityDataQuality(source);
assert.ok(qualitySummary.referencedStatementCount >= 2);
assert.ok(qualitySummary.strengths.some((strength) => strength.includes("references")));
assert.ok(qualitySummary.sourceLinkCount >= 2);

const sourceHints = sourceHintsFromStatement(source.statements.P800[0]);
assert.equal(sourceHints[0].kind, "source-url");
assert.equal(sourceHints[0].url, "https://www.wikidata.org/wiki/Q25169");

const comparison = buildEntityComparison(source, target, { createdAt: "2026-06-25T12:00:00.000Z" });
assert.deepEqual(comparison.sharedProperties.map((property) => property.id), ["P31", "P106"]);
assert.equal(comparison.overlappingEntities[0].id, "Q5");
const comparisonJson = JSON.parse(buildEntityComparisonJsonExport(comparison));
assert.equal(comparisonJson.source.id, "Q42");
assert.equal(comparisonJson.target.id, "Q80");
assert.equal(comparisonJson.summary.sharedPropertyCount, 2);
assert.equal(comparisonJson.safety.mode, "draft-only");

console.log("PASS deterministic Wikidata fixture tests");
