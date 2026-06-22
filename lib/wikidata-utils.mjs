export function entityIdFromDatavalue(value) {
  if (!value) return null;
  if (value.id) return value.id;
  if (value["entity-type"] === "item" && value["numeric-id"]) return `Q${value["numeric-id"]}`;
  if (value["entity-type"] === "property" && value["numeric-id"]) return `P${value["numeric-id"]}`;
  return null;
}

export function sitelinkUrl(site, title) {
  const normalizedTitle = encodeURIComponent(title.replace(/ /g, "_"));

  if (site === "commonswiki") {
    return `https://commons.wikimedia.org/wiki/${normalizedTitle}`;
  }

  const match = site.match(/^([a-z-]+)wiki$/);
  if (match) {
    return `https://${match[1]}.wikipedia.org/wiki/${normalizedTitle}`;
  }

  return `https://www.wikidata.org/wiki/${normalizedTitle}`;
}