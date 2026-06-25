export const AG2_GROUNDING_ERROR_MESSAGE =
  "The AG2 response did not include required Wikidata grounding references.";

const WIKIDATA_ID_PATTERN = /\b[QP]\d+\b/gi;

function cleanOneLine(value, maxLength = 400) {
  return String(value ?? "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeId(value) {
  const id = cleanOneLine(value, 32).toUpperCase();
  return /^[QP]\d+$/.test(id) ? id : "";
}

function uniqueIds(values) {
  return [...new Set(values.map(normalizeId).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function idsFromText(value) {
  return String(value ?? "").match(WIKIDATA_ID_PATTERN) || [];
}

export function collectAg2GroundingIds(value, options = {}) {
  const maxIds = Math.max(1, Math.min(100, Number.parseInt(String(options.maxIds || 40), 10) || 40));
  const seenObjects = new Set();
  const ids = [];

  function visit(node) {
    if (ids.length >= maxIds) return;
    if (node === null || node === undefined) return;

    if (typeof node === "string" || typeof node === "number") {
      ids.push(...idsFromText(node));
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node.slice(0, 60)) visit(item);
      return;
    }

    if (typeof node === "object") {
      if (seenObjects.has(node)) return;
      seenObjects.add(node);
      for (const [key, child] of Object.entries(node).slice(0, 120)) {
        if (["id", "entityId", "compareEntityId", "propertyId"].includes(key) && typeof child === "string") {
          ids.push(child);
        }
        visit(child);
      }
    }
  }

  visit(value);
  return uniqueIds(ids).slice(0, maxIds);
}

export function validateAg2Grounding(responseText, context = {}, options = {}) {
  const text = String(responseText ?? "");
  const expectedIds = uniqueIds(options.expectedIds || collectAg2GroundingIds(context));
  const requiredIds = uniqueIds(options.requiredIds || []);
  const citedIds = uniqueIds(idsFromText(text));
  const matchedIds = expectedIds.filter((id) => citedIds.includes(id));
  const requiredMissingIds = requiredIds.filter((id) => !citedIds.includes(id));
  const minimumMatchedIds = Math.max(0, Number.parseInt(String(options.minimumMatchedIds ?? (expectedIds.length ? 1 : 0)), 10) || 0);
  const hasGroundingReferences = /\bGrounding references\b/i.test(text);
  const errors = [];

  if (!cleanOneLine(text, 1)) {
    errors.push("AG2 response was empty.");
  }
  if (!hasGroundingReferences) {
    errors.push("AG2 response is missing a Grounding references section.");
  }
  if (requiredMissingIds.length) {
    errors.push(`AG2 response did not cite required ID${requiredMissingIds.length === 1 ? "" : "s"}: ${requiredMissingIds.join(", ")}.`);
  }
  if (matchedIds.length < minimumMatchedIds) {
    errors.push("AG2 response did not cite enough Wikidata IDs from the supplied context.");
  }

  return {
    ok: errors.length === 0,
    errors,
    hasGroundingReferences,
    expectedIds,
    citedIds,
    matchedIds,
    requiredMissingIds,
  };
}

export function assertAg2Grounding(responseText, context = {}, options = {}) {
  const validation = validateAg2Grounding(responseText, context, options);
  if (!validation.ok) {
    const error = new Error(AG2_GROUNDING_ERROR_MESSAGE);
    error.validation = validation;
    throw error;
  }
  return validation;
}
