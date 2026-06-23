import { sourceHintsFromStatement } from "./review-source-hints.mjs";

function plural(count, singular, pluralValue = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralValue}`;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function summarizeEntityDataQuality(item) {
  const statementGroups = Object.values(item?.statements || {});
  const statements = statementGroups.flat();
  const sourceHintsByStatement = statements.map((statement) => sourceHintsFromStatement(statement, { limit: 12 }));
  const statementCount = statements.length;
  const propertyCount = statementGroups.filter((group) => group.length > 0).length;
  const deprecatedStatementCount = statements.filter((statement) => statement.rank === "deprecated").length;
  const preferredStatementCount = statements.filter((statement) => statement.rank === "preferred").length;
  const referencedStatementCount = statements.filter((statement) => (statement.references || []).length > 0).length;
  const referencedNonDeprecatedCount = statements.filter((statement) => statement.rank !== "deprecated" && (statement.references || []).length > 0).length;
  const unreferencedStatementCount = statements.filter((statement) => statement.rank !== "deprecated" && (statement.references || []).length === 0).length;
  const qualifiedStatementCount = statements.filter((statement) => (statement.qualifiers || []).length > 0).length;
  const referenceCount = statements.reduce((total, statement) => total + (statement.references || []).length, 0);
  const qualifierCount = statements.reduce((total, statement) => total + (statement.qualifiers || []).length, 0);
  const sourceHintCount = sourceHintsByStatement.reduce((total, hints) => total + hints.length, 0);
  const sourceLinkCount = sourceHintsByStatement.reduce((total, hints) => total + hints.filter((hint) => hint.url).length, 0);
  const sourceLinkedStatementCount = statements.filter((statement, index) => (statement.references || []).length > 0 && sourceHintsByStatement[index].some((hint) => hint.url)).length;
  const nonDeprecatedCount = Math.max(0, statementCount - deprecatedStatementCount);
  const referencedCoverage = nonDeprecatedCount === 0 ? 0 : referencedNonDeprecatedCount / nonDeprecatedCount;
  const sourceLinkCoverage = referencedStatementCount === 0 ? 0 : sourceLinkedStatementCount / referencedStatementCount;
  const score = statementCount === 0
    ? 0
    : clampScore((referencedCoverage * 76) + (sourceLinkCoverage * 6) + Math.min(12, qualifiedStatementCount * 2) + Math.min(6, preferredStatementCount * 2) - deprecatedStatementCount * 8);
  const rating = score >= 80 ? "Strong" : score >= 55 ? "Mixed" : "Needs review";

  const issues = [];
  if (statementCount === 0) issues.push("No visible statements were loaded for this entity.");
  if (unreferencedStatementCount > 0) issues.push(`${plural(unreferencedStatementCount, "visible claim")} lack${unreferencedStatementCount === 1 ? "s" : ""} references.`);
  if (referencedStatementCount > 0 && sourceLinkCount === 0) issues.push("Referenced claims do not expose clickable source links in the visible references.");
  if (deprecatedStatementCount > 0) issues.push(`${plural(deprecatedStatementCount, "deprecated claim")} still appear${deprecatedStatementCount === 1 ? "s" : ""} in the visible statement set.`);

  const strengths = [];
  if (referencedStatementCount > 0) strengths.push(`${plural(referencedStatementCount, "statement")} include${referencedStatementCount === 1 ? "s" : ""} references.`);
  if (sourceLinkCount > 0) strengths.push(`${plural(sourceLinkCount, "source link")} can be opened from visible references.`);
  if (qualifiedStatementCount > 0) strengths.push(`${plural(qualifiedStatementCount, "statement")} include${qualifiedStatementCount === 1 ? "s" : ""} qualifier context.`);
  if (preferredStatementCount > 0) strengths.push(`${plural(preferredStatementCount, "preferred statement")} highlight curated ranks.`);

  return {
    statementCount,
    propertyCount,
    deprecatedStatementCount,
    preferredStatementCount,
    referencedStatementCount,
    unreferencedStatementCount,
    qualifiedStatementCount,
    referenceCount,
    qualifierCount,
    sourceHintCount,
    sourceLinkCount,
    sourceLinkedStatementCount,
    referencedCoverage,
    sourceLinkCoverage,
    score,
    rating,
    issues,
    strengths,
  };
}
