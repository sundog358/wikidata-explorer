function cleanOneLine(value) {
  return String(value || "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function wikidataUrl(id) {
  const cleanId = cleanOneLine(id);
  return cleanId ? `https://www.wikidata.org/wiki/${cleanId}` : "";
}

function sourceLabel(source = {}) {
  const label = cleanOneLine(source.entityLabel || source.label || source.entityId || source.id || "Selected entity");
  const id = cleanOneLine(source.entityId || source.id || "");
  return { id, label };
}

function normalizeFocus(focus = {}) {
  const value = focus || {};

  return {
    id: cleanOneLine(value.id),
    label: cleanOneLine(value.label || value.id || "Selected target"),
    property: cleanOneLine(value.property || value.propertyId || "relationship"),
    propertyId: cleanOneLine(value.propertyId),
    kind: cleanOneLine(value.kind || "item"),
    rank: cleanOneLine(value.rank || "normal"),
    dataType: cleanOneLine(value.dataType || "unknown"),
    qualifierCount: Number.isFinite(value.qualifierCount) ? value.qualifierCount : 0,
    referenceCount: Number.isFinite(value.referenceCount) ? value.referenceCount : 0,
    statementId: cleanOneLine(value.statementId),
    value: cleanOneLine(value.value || value.label || value.id),
  };
}

export function buildGraphPathMarkdownExport(source, focus, options = {}) {
  const src = sourceLabel(source);
  const edge = normalizeFocus(focus);
  const createdAt = formatDate(options.createdAt);

  const lines = [
    `# Wikidata Graph Path: ${src.label}${src.id ? ` (${src.id})` : ""}`,
    "",
    `Generated: ${createdAt}`,
    "",
    "This is a draft research artifact generated from the selected Wikidata graph edge. Verify statements, ranks, qualifiers, and references in Wikidata before using it as evidence.",
    "",
  ];

  if (!src.id || !edge.id || !edge.propertyId) {
    lines.push("No selected graph relationship was available for export.", "");
    return lines.join("\n");
  }

  lines.push(
    "## Selected Path",
    "",
    `- Source: [${src.label} (${src.id})](${wikidataUrl(src.id)})`,
    `- Relationship: ${edge.property} (${edge.propertyId})`,
    `- Target: [${edge.label} (${edge.id})](${wikidataUrl(edge.id)})`,
    `- Rank: ${edge.rank}`,
    `- Evidence: ${edge.referenceCount} reference${edge.referenceCount === 1 ? "" : "s"}; ${edge.qualifierCount} qualifier${edge.qualifierCount === 1 ? "" : "s"}`,
    `- Target type: ${edge.kind}; data type: ${edge.dataType}`,
  );

  if (edge.statementId) lines.push(`- Statement ID: ${edge.statementId}`);

  lines.push(
    "",
    "## Follow-up Checks",
    "",
    "- Open the source and target Wikidata records.",
    "- Confirm the statement rank and whether the target is the intended entity/property.",
    "- Review qualifiers and references before citing or drafting edits.",
    "- Run the graph, verifier, or report AG2 specialist agent with this edge selected for grounded next steps.",
    "",
  );

  return lines.join("\n");
}

export function buildGraphPathJsonExport(source, focus, options = {}) {
  const src = sourceLabel(source);
  const edge = normalizeFocus(focus);
  const createdAt = formatDate(options.createdAt);

  return `${JSON.stringify({
    generatedBy: "Wikidata Explorer",
    artifactType: "selected-graph-path",
    createdAt,
    source: {
      id: src.id,
      label: src.label,
      url: wikidataUrl(src.id),
    },
    edge: {
      propertyId: edge.propertyId,
      propertyLabel: edge.property,
      rank: edge.rank,
      dataType: edge.dataType,
      qualifierCount: edge.qualifierCount,
      referenceCount: edge.referenceCount,
      statementId: edge.statementId || null,
      value: edge.value,
    },
    target: {
      id: edge.id,
      label: edge.label,
      kind: edge.kind,
      url: wikidataUrl(edge.id),
    },
    safety: {
      mode: "draft-only",
      note: "Verify Wikidata references and qualifiers before using this path as evidence or draft-edit context.",
    },
  }, null, 2)}\n`;
}

