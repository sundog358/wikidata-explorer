export const AG2_CHAT_CONTEXT_STORAGE_KEY = "wikidata-explorer.ag2ChatContext.v1";

function cleanOneLine(value, maxLength = 400) {
  return String(value ?? "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanBlock(value, maxLength = 4000) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function validEntityId(value) {
  return /^[QP]\d+$/.test(cleanOneLine(value, 32).toUpperCase());
}

function sanitizeReferencePart(part) {
  if (!part || typeof part !== "object") return null;
  const propertyId = cleanOneLine(part.propertyId, 20);
  const value = cleanOneLine(part.value, 800);
  if (!propertyId && !value) return null;
  return {
    propertyId,
    propertyLabel: cleanOneLine(part.propertyLabel || propertyId, 200),
    value,
  };
}

function sanitizeStatement(statement) {
  if (!statement || typeof statement !== "object") return null;
  const propertyId = cleanOneLine(statement.propertyId, 20);
  const value = cleanOneLine(statement.value, 1000);
  if (!propertyId && !value) return null;

  const references = Array.isArray(statement.references)
    ? statement.references.slice(0, 3).map((reference) => ({
      hash: cleanOneLine(reference?.hash, 120),
      parts: Array.isArray(reference?.parts) ? reference.parts.slice(0, 4).map(sanitizeReferencePart).filter(Boolean) : [],
    })).filter((reference) => reference.hash || reference.parts.length)
    : [];

  return {
    statementId: cleanOneLine(statement.statementId, 200),
    propertyId,
    propertyLabel: cleanOneLine(statement.propertyLabel || propertyId, 200),
    rank: ["deprecated", "normal", "preferred"].includes(statement.rank) ? statement.rank : "normal",
    value,
    qualifiers: Array.isArray(statement.qualifiers) ? statement.qualifiers.slice(0, 4).map(sanitizeReferencePart).filter(Boolean) : [],
    references,
  };
}

function sanitizeEntity(entity) {
  if (!entity || typeof entity !== "object" || !validEntityId(entity.id)) return null;
  return {
    id: cleanOneLine(entity.id, 32).toUpperCase(),
    type: entity.type === "property" ? "property" : "item",
    label: cleanOneLine(entity.label || entity.id, 200),
    description: cleanOneLine(entity.description, 1200),
    statements: Array.isArray(entity.statements) ? entity.statements.slice(0, 16).map(sanitizeStatement).filter(Boolean) : [],
  };
}

function sanitizeGraphFocus(focus) {
  if (!focus || typeof focus !== "object" || !validEntityId(focus.id)) return null;
  const propertyId = cleanOneLine(focus.propertyId, 20);
  if (!/^P\d+$/.test(propertyId)) return null;

  return {
    id: cleanOneLine(focus.id, 32).toUpperCase(),
    label: cleanOneLine(focus.label || focus.id, 200),
    property: cleanOneLine(focus.property || propertyId, 200),
    propertyId,
    kind: focus.kind === "property" ? "property" : "item",
    rank: ["deprecated", "normal", "preferred"].includes(focus.rank) ? focus.rank : "normal",
    dataType: focus.dataType ? cleanOneLine(focus.dataType, 80) : null,
    qualifierCount: Math.min(999, Math.max(0, Number.parseInt(String(focus.qualifierCount || 0), 10) || 0)),
    referenceCount: Math.min(999, Math.max(0, Number.parseInt(String(focus.referenceCount || 0), 10) || 0)),
    statementId: focus.statementId ? cleanOneLine(focus.statementId, 200) : null,
    value: cleanOneLine(focus.value || focus.label || focus.id, 500),
  };
}

function sanitizeGraphPathExport(exportValue) {
  if (!exportValue || typeof exportValue !== "object") return null;
  const markdown = cleanBlock(exportValue.markdown, 4000);
  const json = cleanBlock(exportValue.json, 4000);
  if (!markdown && !json) return null;
  return { markdown, json };
}

export function sanitizeChatVisibleContext(context) {
  if (!context || typeof context !== "object") return null;

  const entity = sanitizeEntity(context.entity);
  const graphFocus = sanitizeGraphFocus(context.graphFocus);
  const selectedStatements = Array.isArray(context.selectedStatements) ? context.selectedStatements.slice(0, 4).map(sanitizeStatement).filter(Boolean) : [];
  const graphPathExport = sanitizeGraphPathExport(context.graphPathExport);

  if (!entity && !graphFocus && !selectedStatements.length && !graphPathExport) return null;

  return {
    source: cleanOneLine(context.source || "visible-workbench", 80),
    createdAt: cleanOneLine(context.createdAt, 80),
    entity,
    graphFocus,
    selectedStatements,
    graphPathExport,
  };
}
