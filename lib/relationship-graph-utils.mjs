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
    sourceProperty: statement.property?.label || statement.property?.id,
    sourcePropertyId: statement.property?.id,
    kind: id.startsWith("P") ? "property" : "item",
    rank: statement.rank,
    dataType: statement.property?.data_type || null,
    qualifierCount: statement.qualifiers?.length || 0,
    referenceCount: statement.references?.length || 0,
    depth: 1,
    source: "statement",
    statement,
  };
}

function relationshipFromEvidencePart(part, statement, source) {
  const id = part?.value?.content?.id;
  if (!id) return null;

  return {
    id,
    label: part.value.content?.label || id,
    property: part.property?.label || part.property?.id,
    propertyId: part.property?.id,
    sourceProperty: statement.property?.label || statement.property?.id,
    sourcePropertyId: statement.property?.id,
    kind: id.startsWith("P") ? "property" : "item",
    rank: statement.rank,
    dataType: part.property?.data_type || null,
    qualifierCount: statement.qualifiers?.length || 0,
    referenceCount: statement.references?.length || 0,
    depth: 2,
    source,
    statement,
  };
}

export function collectRelationshipGraphNodes(item, limit = 48) {
  const seen = new Set();
  const nodes = [];

  function addNode(node) {
    if (!node || seen.has(node.id)) return false;
    seen.add(node.id);
    nodes.push(node);
    return nodes.length >= limit;
  }

  for (const statements of Object.values(item.statements || {})) {
    for (const statement of statements) {
      if (addNode(relationshipFromStatement(statement))) return nodes;

      for (const qualifier of statement.qualifiers || []) {
        if (addNode(relationshipFromEvidencePart(qualifier, statement, "qualifier"))) return nodes;
      }

      for (const reference of statement.references || []) {
        for (const part of reference.parts || []) {
          if (addNode(relationshipFromEvidencePart(part, statement, "reference"))) return nodes;
        }
      }
    }
  }

  return nodes;
}

export function graphPropertyOptions(nodes) {
  return Array.from(
    new Map(nodes.map((node) => [node.sourcePropertyId || node.propertyId, { id: node.sourcePropertyId || node.propertyId, label: node.sourceProperty || node.property || node.propertyId }])).values(),
  ).sort((a, b) => a.label.localeCompare(b.label));
}

export function filterRelationshipGraphNodes(nodes, filters = {}) {
  const {
    depth = "1",
    kind = "all",
    rank = "all",
    propertyId = "all",
    evidence = "all",
  } = filters;

  return nodes.filter((node) => {
    if (depth === "1" && node.depth !== 1) return false;
    if (depth === "property" && propertyId !== "all" && node.sourcePropertyId !== propertyId) return false;
    if (depth === "property" && propertyId === "all" && node.depth !== 1) return false;
    if (kind !== "all" && node.kind !== kind) return false;
    if (rank !== "all" && node.rank !== rank) return false;
    if (propertyId !== "all" && depth !== "property" && node.propertyId !== propertyId) return false;
    if (evidence === "referenced" && node.referenceCount === 0) return false;
    if (evidence === "unreferenced" && node.referenceCount > 0) return false;
    if (evidence === "qualified" && node.qualifierCount === 0) return false;
    return true;
  });
}

function formatStatementValue(value) {
  const content = value?.content;
  if (value?.type === "somevalue") return "Unknown value";
  if (value?.type === "novalue") return "No value";
  if (!content) return "No displayable value";
  if (content.label || content.id) return [content.label, content.id].filter(Boolean).join(" ");
  if (content.time) return String(content.time).replace(/T.*Z$/, "").replace(/^\+/, "");
  if (content.amount) return `${content.amount}${content.unit && content.unit !== "1" ? ` ${content.unit}` : ""}`;
  if (content.latitude !== undefined && content.longitude !== undefined) return `${content.latitude}, ${content.longitude}`;
  if (content.value !== undefined) return String(content.value);
  return String(content);
}

function propertyValueSummary(part) {
  const property = part?.property?.label || part?.property?.id || "Unknown property";
  return `${property}: ${formatStatementValue(part?.value)}`;
}

export function relationshipEvidenceSummary(node, limit = 3) {
  const statement = node?.statement || {};
  const qualifiers = (statement.qualifiers || []).slice(0, limit).map(propertyValueSummary);
  const references = (statement.references || []).slice(0, limit).map((reference, index) => {
    const parts = (reference.parts || []).slice(0, limit).map(propertyValueSummary);
    return parts.length ? parts.join("; ") : `Reference ${index + 1} has no readable parts`;
  });

  return {
    qualifiers,
    references,
    qualifierOverflow: Math.max(0, (statement.qualifiers || []).length - qualifiers.length),
    referenceOverflow: Math.max(0, (statement.references || []).length - references.length),
  };
}
export function graphFocusFromNode(node) {
  if (!node) return null;

  return {
    id: node.id,
    label: node.label || node.id,
    property: node.property || node.propertyId,
    propertyId: node.propertyId,
    sourceProperty: node.sourceProperty || node.property || node.propertyId,
    sourcePropertyId: node.sourcePropertyId || node.propertyId,
    kind: node.kind,
    rank: node.rank,
    dataType: node.dataType || null,
    qualifierCount: node.qualifierCount || 0,
    referenceCount: node.referenceCount || 0,
    depth: node.depth || 1,
    source: node.source || "statement",
    statementId: node.statement?.id || null,
    value: node.label && node.label !== node.id ? `${node.label} (${node.id})` : node.id,
    evidenceSummary: relationshipEvidenceSummary(node),
  };
}

export function relationshipGraphSummary(item, nodes, filteredNodes) {
  const hidden = Math.max(0, nodes.length - filteredNodes.length);
  const label = entityLabel(item);
  if (!nodes.length) return `No explorable relationships found for ${label}.`;
  if (!hidden) return `Showing ${filteredNodes.length} relationship${filteredNodes.length === 1 ? "" : "s"} for ${label}.`;
  return `Showing ${filteredNodes.length} of ${nodes.length} relationships for ${label}; ${hidden} hidden by filters.`;
}
