import assert from "node:assert/strict";
import { summarizeEntityDataQuality } from "../lib/data-quality.mjs";
import { buildEntityComparison, buildEntityComparisonJsonExport, buildEntitySetComparison, buildEntitySetComparisonJsonExport } from "../lib/entity-comparison.mjs";
import {
  collectRelationshipGraphNodes,
  filterRelationshipGraphNodes,
  graphFocusFromNode,
  graphPropertyOptions,
  relationshipEvidenceSummary,
} from "../lib/relationship-graph-utils.mjs";
import { sourceHintsFromStatement } from "../lib/review-source-hints.mjs";
import { fixtureDetailedEntity, fixtureEntityIds, fixtureSearchWikidata } from "./fixtures/wikidata-fixtures.mjs";

assert.deepEqual(fixtureEntityIds().sort(), ["P31", "Q25169", "Q42", "Q46248", "Q80", "Q90", "Q95"]);

const douglasResults = fixtureSearchWikidata("Douglas Adams");
assert.equal(douglasResults.length, 1);
assert.equal(douglasResults[0].id, "Q42");
assert.equal(douglasResults[0].type, "item");
assert.deepEqual(douglasResults[0].statements, {});

const propertyResults = fixtureSearchWikidata("instance of");
assert.equal(propertyResults[0].id, "P31");
assert.equal(propertyResults[0].type, "property");

const workResults = fixtureSearchWikidata("hitchhiker galaxy");
assert.equal(workResults.length, 1);
assert.equal(workResults[0].id, "Q25169");
assert.match(workResults[0].labels.en, /Hitchhiker/);

const authorResults = fixtureSearchWikidata("Terry Pratchett");
assert.equal(authorResults.length, 1);
assert.equal(authorResults[0].id, "Q46248");
assert.match(authorResults[0].descriptions.en, /fantasy author/);

const organizationResults = fixtureSearchWikidata("technology company");
assert.equal(organizationResults.length, 1);
assert.equal(organizationResults[0].id, "Q95");
assert.match(organizationResults[0].descriptions.en, /technology company/);

const placeResults = fixtureSearchWikidata("capital city france");
assert.equal(placeResults.length, 1);
assert.equal(placeResults[0].id, "Q90");
assert.match(placeResults[0].descriptions.en, /France/);

const source = fixtureDetailedEntity("Q42");
const target = fixtureDetailedEntity("Q80");
const relatedWork = fixtureDetailedEntity("Q25169");
const authorTarget = fixtureDetailedEntity("Q46248");
const organizationTarget = fixtureDetailedEntity("Q95");
const placeTarget = fixtureDetailedEntity("Q90");
assert.equal(source.labels.en, "Douglas Adams");
assert.equal(source.aliases.en.includes("DNA"), true);
assert.equal(source.sitelinks.enwiki.url, "https://en.wikipedia.org/wiki/Douglas_Adams");
assert.equal(relatedWork.statements.P50[0].value.content.id, "Q42");
assert.equal(authorTarget.statements.P800[0].value.content.id, "Q1052459");
assert.equal(organizationTarget.type, "item");
assert.equal(organizationTarget.statements.P159[0].value.content.id, "Q486860");
assert.equal(organizationTarget.statements.P856[0].value.content.value, "https://www.google.com/");
assert.equal(placeTarget.type, "item");
assert.equal(placeTarget.statements.P17[0].value.content.id, "Q142");
assert.equal(placeTarget.statements.P131[0].value.content.id, "Q13917");
assert.equal(placeTarget.statements.P625[0].value.content.latitude, 48.8567);
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

const q25169GraphNodes = collectRelationshipGraphNodes(relatedWork);
assert.ok(q25169GraphNodes.some((node) => node.id === "Q42" && node.propertyId === "P50"));
assert.equal(filterRelationshipGraphNodes(q25169GraphNodes, { propertyId: "P50" })[0].label, "Douglas Adams");

const q95GraphNodes = collectRelationshipGraphNodes(organizationTarget);
assert.ok(q95GraphNodes.some((node) => node.id === "Q43229" && node.propertyId === "P31"));
assert.ok(q95GraphNodes.some((node) => node.id === "Q486860" && node.propertyId === "P159"));
assert.ok(q95GraphNodes.some((node) => node.id === "Q30" && node.depth === 2));
assert.deepEqual(graphPropertyOptions(q95GraphNodes).map((property) => property.id).sort(), ["P112", "P159", "P31"]);
assert.equal(filterRelationshipGraphNodes(q95GraphNodes, { propertyId: "P159" })[0].label, "Mountain View");

const q90GraphNodes = collectRelationshipGraphNodes(placeTarget);
assert.ok(q90GraphNodes.some((node) => node.id === "Q515" && node.propertyId === "P31"));
assert.ok(q90GraphNodes.some((node) => node.id === "Q142" && node.propertyId === "P17"));
assert.ok(q90GraphNodes.some((node) => node.id === "Q13917" && node.propertyId === "P131"));
assert.deepEqual(graphPropertyOptions(q90GraphNodes).map((property) => property.id).sort(), ["P131", "P17", "P31"]);
assert.equal(filterRelationshipGraphNodes(q90GraphNodes, { propertyId: "P131" })[0].label, "Ile-de-France");

const qualitySummary = summarizeEntityDataQuality(source);
assert.ok(qualitySummary.referencedStatementCount >= 2);
assert.ok(qualitySummary.strengths.some((strength) => strength.includes("references")));
assert.ok(qualitySummary.sourceLinkCount >= 2);

const organizationQualitySummary = summarizeEntityDataQuality(organizationTarget);
assert.equal(organizationQualitySummary.statementCount, 6);
assert.ok(organizationQualitySummary.sourceLinkCount >= 2);

const sourceHints = sourceHintsFromStatement(source.statements.P800[0]);
assert.equal(sourceHints[0].kind, "source-url");
assert.equal(sourceHints[0].url, "https://www.wikidata.org/wiki/Q25169");

const organizationSourceHints = sourceHintsFromStatement(organizationTarget.statements.P112[0]);
assert.equal(organizationSourceHints[0].kind, "source-url");
assert.equal(organizationSourceHints[0].url, "https://about.google/our-story/");

const placeSourceHints = sourceHintsFromStatement(placeTarget.statements.P17[0]);
assert.equal(placeSourceHints[0].kind, "source-url");
assert.equal(placeSourceHints[0].url, "https://www.paris.fr/");

const comparison = buildEntityComparison(source, target, { createdAt: "2026-06-25T12:00:00.000Z" });
assert.deepEqual(comparison.sharedProperties.map((property) => property.id), ["P31", "P106"]);
assert.equal(comparison.overlappingEntities[0].id, "Q5");
const comparisonJson = JSON.parse(buildEntityComparisonJsonExport(comparison));
assert.equal(comparisonJson.source.id, "Q42");
assert.equal(comparisonJson.target.id, "Q80");
assert.equal(comparisonJson.summary.sharedPropertyCount, 2);
assert.equal(comparisonJson.safety.mode, "draft-only");

const workComparison = buildEntityComparison(source, relatedWork, { createdAt: "2026-06-25T12:00:00.000Z" });
assert.equal(workComparison.target.id, "Q25169");
assert.equal(workComparison.overlappingEntities.some((entity) => entity.id === "Q42"), false);
assert.equal(workComparison.targetUniqueProperties.some((property) => property.id === "P50"), true);

const authorComparison = buildEntityComparison(source, authorTarget, { createdAt: "2026-06-25T12:00:00.000Z" });
assert.equal(authorComparison.target.id, "Q46248");
assert.deepEqual(authorComparison.sharedProperties.map((property) => property.id), ["P569", "P31", "P800", "P106"]);
assert.equal(authorComparison.overlappingEntities.some((entity) => entity.id === "Q36180"), true);
assert.equal(authorComparison.targetUniqueProperties.some((property) => property.id === "P27"), true);

const organizationComparison = buildEntityComparison(relatedWork, organizationTarget, { createdAt: "2026-06-25T12:00:00.000Z" });
assert.equal(organizationComparison.source.id, "Q25169");
assert.equal(organizationComparison.target.id, "Q95");
assert.deepEqual(organizationComparison.sharedProperties.map((property) => property.id), ["P31"]);
assert.equal(organizationComparison.targetUniqueProperties.some((property) => property.id === "P159"), true);
const organizationComparisonJson = JSON.parse(buildEntityComparisonJsonExport(organizationComparison));
assert.equal(organizationComparisonJson.target.id, "Q95");
assert.equal(organizationComparisonJson.summary.sharedPropertyCount, 1);
assert.equal(organizationComparisonJson.summary.targetUniquePropertyCount, 5);

const placeComparison = buildEntityComparison(organizationTarget, placeTarget, { createdAt: "2026-06-25T12:00:00.000Z" });
assert.equal(placeComparison.source.id, "Q95");
assert.equal(placeComparison.target.id, "Q90");
assert.deepEqual(placeComparison.sharedProperties.map((property) => property.id), ["P18", "P31"]);
assert.equal(placeComparison.targetUniqueProperties.some((property) => property.id === "P17"), true);
const placeSetComparison = buildEntitySetComparison([relatedWork, organizationTarget, placeTarget], { createdAt: "2026-06-25T12:00:00.000Z" });
assert.deepEqual(placeSetComparison.entities.map((entity) => entity.id), ["Q25169", "Q95", "Q90"]);
assert.equal(placeSetComparison.propertyMatrix.some((property) => property.id === "P17"), true);
assert.equal(placeSetComparison.propertyMatrix.some((property) => property.id === "P131"), true);
const placeSetComparisonJson = JSON.parse(buildEntitySetComparisonJsonExport(placeSetComparison));
assert.equal(placeSetComparisonJson.summary.entityCount, 3);
assert.equal(placeSetComparisonJson.entities.some((entity) => entity.id === "Q90"), true);

console.log("PASS deterministic Wikidata fixture tests");
