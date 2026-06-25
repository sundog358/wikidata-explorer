function entityLabel(item) {
  if (!item) return "";
  return item.labels?.en || Object.values(item.labels || {})[0] || item.id;
}

function entityDescription(item) {
  if (!item) return "";
  return item.descriptions?.en || Object.values(item.descriptions || {})[0] || "No description available.";
}

function allStatements(item) {
  return Object.values(item?.statements || {}).flat();
}

function statementValueId(statement) {
  const id = statement?.value?.content?.id;
  return /^[QP]\d+$/.test(String(id || "")) ? id : null;
}

function propertyRows(item) {
  return Object.entries(item?.statements || {}).map(([id, statements]) => ({
    id,
    label: statements[0]?.property?.label || id,
    count: statements.length,
    referencedCount: statements.filter((statement) => (statement.references || []).length > 0).length,
    qualifiedCount: statements.filter((statement) => (statement.qualifiers || []).length > 0).length,
    valueIds: statements.map(statementValueId).filter(Boolean),
  }));
}

function relatedEntityRows(item) {
  const rows = new Map();

  for (const statement of allStatements(item)) {
    const id = statementValueId(statement);
    if (!id?.startsWith("Q")) continue;
    const current = rows.get(id) || {
      id,
      label: statement.value.content?.label || id,
      properties: new Set(),
    };
    current.properties.add(statement.property?.label || statement.property?.id || "statement");
    rows.set(id, current);
  }

  return Array.from(rows.values()).map((row) => ({
    id: row.id,
    label: row.label,
    properties: Array.from(row.properties).sort((a, b) => a.localeCompare(b)),
  }));
}

function statsFor(item) {
  const statements = allStatements(item);
  const referencedStatementCount = statements.filter((statement) => (statement.references || []).length > 0).length;
  const qualifiedStatementCount = statements.filter((statement) => (statement.qualifiers || []).length > 0).length;

  return {
    id: item?.id || "",
    label: entityLabel(item),
    description: entityDescription(item),
    propertyCount: Object.keys(item?.statements || {}).length,
    statementCount: statements.length,
    referencedStatementCount,
    qualifiedStatementCount,
    sitelinkCount: Object.keys(item?.sitelinks || {}).length,
    languageCount: Object.keys(item?.labels || {}).length,
  };
}

function byId(rows) {
  return new Map(rows.map((row) => [row.id, row]));
}

export function buildEntityComparison(source, target, options = {}) {
  const sourceProperties = propertyRows(source);
  const targetProperties = propertyRows(target);
  const sourcePropertyMap = byId(sourceProperties);
  const targetPropertyMap = byId(targetProperties);
  const sourceRelatedMap = byId(relatedEntityRows(source));
  const targetRelatedMap = byId(relatedEntityRows(target));

  const sharedProperties = sourceProperties
    .filter((row) => targetPropertyMap.has(row.id))
    .map((row) => {
      const targetRow = targetPropertyMap.get(row.id);
      return {
        id: row.id,
        label: row.label || targetRow.label,
        sourceCount: row.count,
        targetCount: targetRow.count,
        sourceReferencedCount: row.referencedCount,
        targetReferencedCount: targetRow.referencedCount,
      };
    })
    .sort((a, b) => (b.sourceCount + b.targetCount) - (a.sourceCount + a.targetCount) || a.label.localeCompare(b.label));

  const sourceUniqueProperties = sourceProperties
    .filter((row) => !targetPropertyMap.has(row.id))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const targetUniqueProperties = targetProperties
    .filter((row) => !sourcePropertyMap.has(row.id))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const overlappingEntities = Array.from(sourceRelatedMap.values())
    .filter((row) => targetRelatedMap.has(row.id))
    .map((row) => {
      const targetRow = targetRelatedMap.get(row.id);
      return {
        id: row.id,
        label: row.label || targetRow.label,
        sourceProperties: row.properties,
        targetProperties: targetRow.properties,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    generatedAt: options.createdAt || new Date().toISOString(),
    source: statsFor(source),
    target: statsFor(target),
    sharedProperties,
    sourceUniqueProperties,
    targetUniqueProperties,
    overlappingEntities,
  };
}

function propertyLine(row, sourceLabel, targetLabel) {
  return `- ${row.label} (${row.id}): ${sourceLabel} ${row.sourceCount} statement(s), ${targetLabel} ${row.targetCount} statement(s).`;
}

export function buildEntityComparisonMarkdownExport(comparison, options = {}) {
  const limit = options.limit || 8;
  const lines = [
    `# Entity comparison: ${comparison.source.label} (${comparison.source.id}) vs ${comparison.target.label} (${comparison.target.id})`,
    "",
    `Generated: ${comparison.generatedAt}`,
    "",
    "This is a draft research artifact generated from visible Wikidata statement data. Verify statements, ranks, qualifiers, and references in Wikidata before using it as evidence.",
    "",
    "## Summary",
    "",
    `- Shared properties: ${comparison.sharedProperties.length}`,
    `- Unique to ${comparison.source.label}: ${comparison.sourceUniqueProperties.length}`,
    `- Unique to ${comparison.target.label}: ${comparison.targetUniqueProperties.length}`,
    `- Overlapping related entities: ${comparison.overlappingEntities.length}`,
    "",
    "## Shared Properties",
    "",
  ];

  if (comparison.sharedProperties.length) {
    lines.push(...comparison.sharedProperties.slice(0, limit).map((row) => propertyLine(row, comparison.source.label, comparison.target.label)));
  } else {
    lines.push("- No shared properties were visible in the loaded statement sets.");
  }

  lines.push("", `## Unique To ${comparison.source.label}`, "");
  if (comparison.sourceUniqueProperties.length) {
    lines.push(...comparison.sourceUniqueProperties.slice(0, limit).map((row) => `- ${row.label} (${row.id}): ${row.count} statement(s).`));
  } else {
    lines.push("- No source-only properties were visible.");
  }

  lines.push("", `## Unique To ${comparison.target.label}`, "");
  if (comparison.targetUniqueProperties.length) {
    lines.push(...comparison.targetUniqueProperties.slice(0, limit).map((row) => `- ${row.label} (${row.id}): ${row.count} statement(s).`));
  } else {
    lines.push("- No target-only properties were visible.");
  }

  lines.push("", "## Overlapping Related Entities", "");
  if (comparison.overlappingEntities.length) {
    lines.push(...comparison.overlappingEntities.slice(0, limit).map((row) => `- ${row.label} (${row.id})`));
  } else {
    lines.push("- No overlapping related entities were visible in statement values.");
  }

  lines.push("");
  return lines.join("\n");
}
