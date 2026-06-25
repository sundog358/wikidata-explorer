function entityLabel(item) {
  if (!item) return "";
  return item.labels?.en || Object.values(item.labels || {})[0] || item.id;
}

function entityDescription(item) {
  if (!item) return "";
  return item.descriptions?.en || Object.values(item.descriptions || {})[0] || "No description available.";
}

function wikidataUrl(id) {
  return /^[PQ]\d+$/.test(String(id || "")) ? `https://www.wikidata.org/wiki/${id}` : "";
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

export function buildEntitySetComparison(items, options = {}) {
  const entities = Array.from(
    new Map((items || []).filter(Boolean).map((item) => [item.id, item])).values(),
  ).slice(0, 3);
  const entityStats = entities.map(statsFor);
  const propertyMaps = entities.map((item) => byId(propertyRows(item)));
  const labelsByProperty = new Map();

  for (const rows of propertyMaps) {
    for (const row of rows.values()) {
      if (!labelsByProperty.has(row.id)) labelsByProperty.set(row.id, row.label);
    }
  }

  const propertyMatrix = Array.from(labelsByProperty.entries()).map(([id, label]) => {
    const cells = entityStats.map((entity, index) => {
      const row = propertyMaps[index].get(id);
      return {
        entityId: entity.id,
        entityLabel: entity.label,
        count: row?.count || 0,
        referencedCount: row?.referencedCount || 0,
        qualifiedCount: row?.qualifiedCount || 0,
      };
    });

    return {
      id,
      label,
      cells,
      presentCount: cells.filter((cell) => cell.count > 0).length,
      totalStatementCount: cells.reduce((sum, cell) => sum + cell.count, 0),
      totalReferencedCount: cells.reduce((sum, cell) => sum + cell.referencedCount, 0),
      sharedByAll: entities.length > 1 && cells.every((cell) => cell.count > 0),
    };
  }).sort((a, b) => Number(b.sharedByAll) - Number(a.sharedByAll) || b.presentCount - a.presentCount || b.totalStatementCount - a.totalStatementCount || a.label.localeCompare(b.label));

  return {
    generatedAt: options.createdAt || new Date().toISOString(),
    entities: entityStats,
    propertyMatrix,
    sharedByAllProperties: propertyMatrix.filter((row) => row.sharedByAll),
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

export function buildEntityComparisonJsonExport(comparison, options = {}) {
  const limit = options.limit || 12;

  return `${JSON.stringify({
    generatedBy: "Wikidata Explorer",
    artifactType: "entity-comparison",
    createdAt: comparison.generatedAt,
    source: {
      ...comparison.source,
      url: wikidataUrl(comparison.source.id),
    },
    target: {
      ...comparison.target,
      url: wikidataUrl(comparison.target.id),
    },
    summary: {
      sharedPropertyCount: comparison.sharedProperties.length,
      sourceUniquePropertyCount: comparison.sourceUniqueProperties.length,
      targetUniquePropertyCount: comparison.targetUniqueProperties.length,
      overlappingEntityCount: comparison.overlappingEntities.length,
    },
    sharedProperties: comparison.sharedProperties.slice(0, limit),
    sourceUniqueProperties: comparison.sourceUniqueProperties.slice(0, limit),
    targetUniqueProperties: comparison.targetUniqueProperties.slice(0, limit),
    overlappingEntities: comparison.overlappingEntities.slice(0, limit).map((entity) => ({
      ...entity,
      url: wikidataUrl(entity.id),
    })),
    safety: {
      mode: "draft-only",
      note: "Verify Wikidata statements, ranks, qualifiers, and references before citing or drafting edits from this comparison.",
    },
  }, null, 2)}\n`;
}

export function buildEntitySetComparisonMarkdownExport(comparison, options = {}) {
  const limit = options.limit || 10;
  const title = comparison.entities.map((entity) => `${entity.label} (${entity.id})`).join(" vs ");
  const lines = [
    `# Entity set comparison: ${title}`,
    "",
    `Generated: ${comparison.generatedAt}`,
    "",
    "This is a draft research artifact generated from visible Wikidata statement data. Verify statements, ranks, qualifiers, and references in Wikidata before using it as evidence.",
    "",
    "## Summary",
    "",
    `- Entities: ${comparison.entities.length}`,
    `- Properties in matrix: ${comparison.propertyMatrix.length}`,
    `- Shared by all entities: ${comparison.sharedByAllProperties.length}`,
    "",
    "## Property Matrix",
    "",
  ];

  if (comparison.propertyMatrix.length) {
    for (const row of comparison.propertyMatrix.slice(0, limit)) {
      const counts = row.cells.map((cell) => `${cell.entityId}: ${cell.count} statement(s), ${cell.referencedCount} referenced`).join("; ");
      lines.push(`- ${row.label} (${row.id}): ${counts}`);
    }
  } else {
    lines.push("- No properties were visible in the loaded statement sets.");
  }

  lines.push("");
  return lines.join("\n");
}

export function buildEntitySetComparisonJsonExport(comparison, options = {}) {
  const limit = options.limit || 16;

  return `${JSON.stringify({
    generatedBy: "Wikidata Explorer",
    artifactType: "entity-set-comparison",
    createdAt: comparison.generatedAt,
    entities: comparison.entities.map((entity) => ({
      ...entity,
      url: wikidataUrl(entity.id),
    })),
    summary: {
      entityCount: comparison.entities.length,
      propertyCount: comparison.propertyMatrix.length,
      sharedByAllPropertyCount: comparison.sharedByAllProperties.length,
    },
    propertyMatrix: comparison.propertyMatrix.slice(0, limit),
    safety: {
      mode: "draft-only",
      note: "Verify Wikidata statements, ranks, qualifiers, and references before citing or drafting edits from this comparison.",
    },
  }, null, 2)}\n`;
}

function normalizePropertyId(propertyId) {
  return String(propertyId || "").trim().toUpperCase();
}

function propertyFocusFromSetComparison(comparison, propertyId) {
  const normalizedPropertyId = normalizePropertyId(propertyId);
  const row = comparison?.propertyMatrix?.find((property) => property.id === normalizedPropertyId);
  if (!row) return null;

  return {
    generatedAt: comparison.generatedAt,
    sourceArtifactType: "entity-set-comparison",
    property: {
      id: row.id,
      label: row.label,
    },
    entities: row.cells.map((cell) => ({
      entityId: cell.entityId,
      entityLabel: cell.entityLabel,
      count: cell.count,
      referencedCount: cell.referencedCount,
      qualifiedCount: cell.qualifiedCount,
      status: cell.count > 0 ? "present" : "missing",
    })),
    coverage: {
      entityCount: row.cells.length,
      presentCount: row.presentCount,
      totalStatementCount: row.totalStatementCount,
      totalReferencedCount: row.totalReferencedCount,
      sharedByAll: row.sharedByAll,
    },
  };
}

function propertyFocusFromPairComparison(comparison, propertyId) {
  const normalizedPropertyId = normalizePropertyId(propertyId);
  const shared = comparison?.sharedProperties?.find((property) => property.id === normalizedPropertyId);
  const sourceOnly = comparison?.sourceUniqueProperties?.find((property) => property.id === normalizedPropertyId);
  const targetOnly = comparison?.targetUniqueProperties?.find((property) => property.id === normalizedPropertyId);
  const row = shared || sourceOnly || targetOnly;
  if (!comparison || !row) return null;

  const sourceCount = shared ? shared.sourceCount : sourceOnly?.count || 0;
  const targetCount = shared ? shared.targetCount : targetOnly?.count || 0;
  const sourceReferencedCount = shared ? shared.sourceReferencedCount : sourceOnly?.referencedCount || 0;
  const targetReferencedCount = shared ? shared.targetReferencedCount : targetOnly?.referencedCount || 0;
  const sourceQualifiedCount = sourceOnly?.qualifiedCount || 0;
  const targetQualifiedCount = targetOnly?.qualifiedCount || 0;

  return {
    generatedAt: comparison.generatedAt,
    sourceArtifactType: "entity-comparison",
    property: {
      id: row.id,
      label: row.label,
    },
    entities: [
      {
        entityId: comparison.source.id,
        entityLabel: comparison.source.label,
        count: sourceCount,
        referencedCount: sourceReferencedCount,
        qualifiedCount: sourceQualifiedCount,
        status: sourceCount > 0 ? "present" : "missing",
      },
      {
        entityId: comparison.target.id,
        entityLabel: comparison.target.label,
        count: targetCount,
        referencedCount: targetReferencedCount,
        qualifiedCount: targetQualifiedCount,
        status: targetCount > 0 ? "present" : "missing",
      },
    ],
    coverage: {
      entityCount: 2,
      presentCount: [sourceCount, targetCount].filter((count) => count > 0).length,
      totalStatementCount: sourceCount + targetCount,
      totalReferencedCount: sourceReferencedCount + targetReferencedCount,
      sharedByAll: sourceCount > 0 && targetCount > 0,
    },
  };
}

export function buildComparisonPropertyFocus(comparison, propertyId) {
  if (!comparison || !propertyId) return null;
  if (Array.isArray(comparison.propertyMatrix)) return propertyFocusFromSetComparison(comparison, propertyId);
  return propertyFocusFromPairComparison(comparison, propertyId);
}

export function buildComparisonPropertyMarkdownExport(propertyFocus) {
  if (!propertyFocus) return "";
  const lines = [
    `# Comparison property focus: ${propertyFocus.property.label} (${propertyFocus.property.id})`,
    "",
    `Generated: ${propertyFocus.generatedAt}`,
    "",
    "This is a draft research artifact generated from visible Wikidata statement data. Verify statements, ranks, qualifiers, and references in Wikidata before using it as evidence.",
    "",
    "## Coverage",
    "",
    `- Present in: ${propertyFocus.coverage.presentCount}/${propertyFocus.coverage.entityCount} entities`,
    `- Total statements: ${propertyFocus.coverage.totalStatementCount}`,
    `- Referenced statements: ${propertyFocus.coverage.totalReferencedCount}`,
    `- Shared by all compared entities: ${propertyFocus.coverage.sharedByAll ? "yes" : "no"}`,
    "",
    "## Entity Counts",
    "",
  ];

  for (const entity of propertyFocus.entities) {
    lines.push(`- ${entity.entityLabel} (${entity.entityId}): ${entity.count} statement(s), ${entity.referencedCount} referenced, ${entity.qualifiedCount} qualified.`);
  }

  lines.push("");
  return lines.join("\n");
}

export function buildComparisonPropertyJsonExport(propertyFocus) {
  if (!propertyFocus) return "";
  return `${JSON.stringify({
    generatedBy: "Wikidata Explorer",
    artifactType: "comparison-property-focus",
    createdAt: propertyFocus.generatedAt,
    sourceArtifactType: propertyFocus.sourceArtifactType,
    property: {
      ...propertyFocus.property,
      url: wikidataUrl(propertyFocus.property.id),
    },
    entities: propertyFocus.entities.map((entity) => ({
      ...entity,
      url: wikidataUrl(entity.entityId),
    })),
    coverage: propertyFocus.coverage,
    safety: {
      mode: "draft-only",
      note: "Verify Wikidata statements, ranks, qualifiers, and references before citing or drafting edits from this property-focused comparison.",
    },
  }, null, 2)}\n`;
}
