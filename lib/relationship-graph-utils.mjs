function entityLabel(item) {
  return item.labels?.en || Object.values(item.labels || {})[0] || item.id;
}

function relationshipFromStatement(statement) {
  const id = statement.value?.content?.id;
  if (!id) return null;

  return {
    id,
    label: statement.value.content?.label || id,
    property: statement.property?.label || statement.property?.id,
    propertyId: statement.property?.id,
    kind: id.startsWith("P") ? "property" : "item",
    rank: statement.rank,
    dataType: statement.property?.data_type || null,
    qualifierCount: statement.qualifiers?.length || 0,
    referenceCount: statement.references?.length || 0,
    statement,
  };
}

export function collectRelationshipGraphNodes(item, limit = 48) {
  const seen = new Set();
  const nodes = [];

  for (const statements of Object.values(item.statements || {})) {
    for (const statement of statements) {
      const node = relationshipFromStatement(statement);
      if (!node || seen.has(node.id)) continue;
      seen.add(node.id);
      nodes.push(node);
      if (nodes.length >= limit) return nodes;
    }
  }

  return nodes;
}

export function graphPropertyOptions(nodes) {
  return Array.from(
    new Map(nodes.map((node) => [node.propertyId, { id: node.propertyId, label: node.property || node.propertyId }])).values(),
  ).sort((a, b) => a.label.localeCompare(b.label));
}

export function filterRelationshipGraphNodes(nodes, filters = {}) {
  const {
    kind = "all",
    rank = "all",
    propertyId = "all",
    evidence = "all",
  } = filters;

  return nodes.filter((node) => {
    if (kind !== "all" && node.kind !== kind) return false;
    if (rank !== "all" && node.rank !== rank) return false;
    if (propertyId !== "all" && node.propertyId !== propertyId) return false;
    if (evidence === "referenced" && node.referenceCount === 0) return false;
    if (evidence === "unreferenced" && node.referenceCount > 0) return false;
    if (evidence === "qualified" && node.qualifierCount === 0) return false;
    return true;
  });
}

export function relationshipGraphSummary(item, nodes, filteredNodes) {
  const hidden = Math.max(0, nodes.length - filteredNodes.length);
  const label = entityLabel(item);
  if (!nodes.length) return `No explorable relationships found for ${label}.`;
  if (!hidden) return `Showing ${filteredNodes.length} relationship${filteredNodes.length === 1 ? "" : "s"} for ${label}.`;
  return `Showing ${filteredNodes.length} of ${nodes.length} relationships for ${label}; ${hidden} hidden by filters.`;
}