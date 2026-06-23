function cleanOneLine(value) {
  return String(value ?? "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SOURCE_URL_PROPERTIES = new Set(["P854", "P1065", "P953"]);
const STATED_IN_PROPERTIES = new Set(["P248"]);
const RETRIEVAL_DATE_PROPERTIES = new Set(["P813"]);

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}

function isWikidataEntityId(value) {
  return /^[PQ]\d+$/i.test(value);
}

function wikidataEntityUrl(id) {
  const cleanId = cleanOneLine(id).toUpperCase();
  return isWikidataEntityId(cleanId) ? `https://www.wikidata.org/wiki/${cleanId}` : "";
}

function formatterExternalIdUrl(formatterUrl, value) {
  const formatter = cleanOneLine(formatterUrl);
  const identifier = cleanOneLine(value);
  if (!formatter || !identifier || !isHttpUrl(formatter) || !formatter.includes("$1")) return "";
  return formatter.replace(/\$1/g, encodeURIComponent(identifier));
}

function stringifyContent(value) {
  if (value === null || value === undefined) return "";
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function sourceHintValueText(value) {
  const content = value?.content;
  if (!content) return cleanOneLine(value?.type || "");

  if (content.id) {
    const label = cleanOneLine(content.label);
    const id = cleanOneLine(content.id);
    return label && label !== id ? `${label} (${id})` : id;
  }

  if (content.time) return cleanOneLine(String(content.time).replace(/T.*Z$/, "").replace(/^\+/, ""));
  if (content.amount !== undefined) {
    const unit = content.unit && content.unit !== "1" ? ` ${content.unit}` : "";
    return cleanOneLine(`${content.amount}${unit}`);
  }
  if (content.latitude !== undefined && content.longitude !== undefined) {
    return cleanOneLine(`${content.latitude}, ${content.longitude}`);
  }
  if (content.value !== undefined) return cleanOneLine(stringifyContent(content.value));

  return cleanOneLine(stringifyContent(content));
}

export function sourceHintKind(part) {
  const propertyId = cleanOneLine(part?.property?.id);
  const dataType = cleanOneLine(part?.property?.data_type);
  const value = sourceHintValueText(part?.value);

  if (SOURCE_URL_PROPERTIES.has(propertyId) || isHttpUrl(value)) return "source-url";
  if (STATED_IN_PROPERTIES.has(propertyId)) return "stated-in";
  if (RETRIEVAL_DATE_PROPERTIES.has(propertyId)) return "retrieved";
  if (dataType === "external-id") return "external-id";
  return "reference-value";
}

export function sourceHintUrl(part) {
  const kind = sourceHintKind(part);
  const content = part?.value?.content;
  const rawValue = cleanOneLine(content?.value);
  const entityId = cleanOneLine(content?.id);

  if (kind === "source-url" && isHttpUrl(rawValue)) return rawValue;
  if (kind === "stated-in") return wikidataEntityUrl(entityId);
  if (kind === "external-id") return formatterExternalIdUrl(part?.property?.formatter_url, rawValue);
  return "";
}

export function sourceHintKindLabel(kind) {
  switch (kind) {
    case "source-url":
      return "Source URL";
    case "stated-in":
      return "Stated in";
    case "retrieved":
      return "Retrieved";
    case "external-id":
      return "External ID";
    default:
      return "Reference value";
  }
}

export function formatSourceHint(hint) {
  const propertyId = cleanOneLine(hint?.propertyId);
  const propertyLabel = cleanOneLine(hint?.propertyLabel || propertyId || "source");
  const kind = sourceHintKindLabel(hint?.kind);
  const value = cleanOneLine(hint?.value);
  const url = cleanOneLine(hint?.url);
  const property = propertyId && propertyLabel !== propertyId ? `${propertyLabel} (${propertyId})` : propertyLabel;
  const urlSuffix = url && url !== value ? ` (${url})` : "";
  return cleanOneLine(`${kind}: ${property}${value ? ` = ${value}` : ""}${urlSuffix}`);
}

export function sourceHintSummary(hints) {
  const rows = Array.isArray(hints) ? hints.map(formatSourceHint).filter(Boolean) : [];
  return rows.length ? rows.join("; ") : "No source hints available";
}

export function sourceHintsFromStatement(statement, options = {}) {
  const limit = typeof options === "number" ? options : options.limit ?? 6;
  const references = Array.isArray(statement?.references) ? statement.references : [];
  const hints = [];
  const seen = new Set();

  for (const reference of references) {
    const parts = Array.isArray(reference?.parts) ? reference.parts : [];
    for (const part of parts) {
      const propertyId = cleanOneLine(part?.property?.id);
      const propertyLabel = cleanOneLine(part?.property?.label || propertyId);
      const value = sourceHintValueText(part?.value);
      if (!propertyId && !value) continue;

      const kind = sourceHintKind(part);
      const hint = {
        propertyId,
        propertyLabel,
        value,
        kind,
        url: sourceHintUrl(part),
        referenceHash: cleanOneLine(reference?.hash),
      };
      const key = `${hint.propertyId}\u0000${hint.value}\u0000${hint.kind}`;
      if (seen.has(key)) continue;

      seen.add(key);
      hints.push(hint);
      if (hints.length >= limit) return hints;
    }
  }

  return hints;
}
