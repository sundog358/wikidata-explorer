const API_BASE_URL = "https://www.wikidata.org/w/api.php";
const REST_BASE_URL = "https://www.wikidata.org/w/rest.php/wikibase/v1";

export type WikidataItem = {
  id: string;
  type: "item" | "property";
  labels: Record<string, string>;
  descriptions: Record<string, string>;
  aliases: Record<string, string[]>;
  statements: Record<string, WikidataStatement[]>;
  sitelinks: Record<string, WikidataSitelink>;
};

export type WikidataStatement = {
  id: string;
  rank: "deprecated" | "normal" | "preferred";
  property: {
    id: string;
    label?: string;
    data_type: string | null;
  };
  value: {
    type: string;
    content?: any;
  };
  qualifiers: WikidataQualifier[];
  references: WikidataReference[];
  propertyId?: string;
  explorable?: boolean;
};

export type WikidataSitelink = {
  title: string;
  badges: string[];
  url: string;
};

export type WikidataQualifier = {
  property: {
    id: string;
    label?: string;
    data_type: string | null;
  };
  value: {
    type: string;
    content?: any;
  };
};

export type WikidataReference = {
  hash: string;
  parts: {
    property: {
      id: string;
      label?: string;
      data_type: string | null;
    };
    value: {
      type: string;
      content?: any;
    };
  }[];
};

export interface WikidataLanguage {
  code: string;
  name: string;
}

export interface WikidataMediaInfo {
  url: string;
  mime: string;
  mediatype: "BITMAP" | "AUDIO" | "VIDEO" | "OTHER";
  title?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
}

type LabelMap = Record<string, string>;

function normalizeLanguageMap(value: Record<string, any> = {}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).map(([lang, entry]) => [
      lang,
      typeof entry === "string" ? entry : entry?.value || "",
    ]),
  );
}

function normalizeAliases(value: Record<string, any[]> = {}): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(value).map(([lang, aliases]) => [
      lang,
      aliases.map((alias) => (typeof alias === "string" ? alias : alias?.value)).filter(Boolean),
    ]),
  );
}

function sitelinkUrl(site: string, title: string): string {
  if (site === "commonswiki") {
    return `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  }

  const match = site.match(/^([a-z-]+)wiki$/);
  if (match) {
    return `https://${match[1]}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  }

  return `https://www.wikidata.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

function normalizeSitelinks(value: Record<string, any> = {}): Record<string, WikidataSitelink> {
  return Object.fromEntries(
    Object.entries(value).map(([site, link]) => [
      site,
      {
        title: link.title,
        badges: link.badges || [],
        url: link.url || sitelinkUrl(site, link.title),
      },
    ]),
  );
}

function entityIdFromDatavalue(value: any): string | null {
  if (!value) return null;
  if (value.id) return value.id;
  if (value["entity-type"] === "item" && value["numeric-id"]) return `Q${value["numeric-id"]}`;
  if (value["entity-type"] === "property" && value["numeric-id"]) return `P${value["numeric-id"]}`;
  return null;
}

function collectEntityIdsFromSnak(snak: any, ids: Set<string>) {
  const id = entityIdFromDatavalue(snak?.datavalue?.value);
  if (id) ids.add(id);
}

function collectIdsFromClaims(claims: Record<string, any[]> = {}): string[] {
  const ids = new Set<string>();

  Object.entries(claims).forEach(([propertyId, propertyClaims]) => {
    ids.add(propertyId);
    propertyClaims.forEach((claim) => {
      collectEntityIdsFromSnak(claim.mainsnak, ids);
      Object.entries(claim.qualifiers || {}).forEach(([qualifierPropertyId, qualifiers]: [string, any]) => {
        ids.add(qualifierPropertyId);
        if (Array.isArray(qualifiers)) {
          qualifiers.forEach((qualifier) => collectEntityIdsFromSnak(qualifier, ids));
        }
      });
      (claim.references || []).forEach((reference: any) => {
        Object.entries(reference.snaks || {}).forEach(([referencePropertyId, snaks]: [string, any]) => {
          ids.add(referencePropertyId);
          if (Array.isArray(snaks)) {
            snaks.forEach((snak) => collectEntityIdsFromSnak(snak, ids));
          }
        });
      });
    });
  });

  return Array.from(ids);
}

function normalizeSnakValue(snak: any, labels: LabelMap) {
  if (!snak || snak.snaktype !== "value") {
    return { type: snak?.snaktype || "novalue" };
  }

  const dataType = snak.datatype || snak.datavalue?.type || "unknown";
  const rawValue = snak.datavalue?.value;
  const entityId = entityIdFromDatavalue(rawValue);

  if (entityId) {
    return {
      type: dataType,
      content: {
        id: entityId,
        label: labels[entityId] || entityId,
      },
    };
  }

  if (dataType === "time") {
    return {
      type: dataType,
      content: {
        time: rawValue?.time,
        precision: rawValue?.precision,
      },
    };
  }

  if (dataType === "quantity") {
    return {
      type: dataType,
      content: {
        amount: rawValue?.amount,
        unit: rawValue?.unit,
      },
    };
  }

  if (dataType === "globecoordinate") {
    return {
      type: dataType,
      content: {
        latitude: rawValue?.latitude,
        longitude: rawValue?.longitude,
        precision: rawValue?.precision,
      },
    };
  }

  if (dataType === "monolingualtext") {
    return {
      type: dataType,
      content: {
        value: rawValue?.text,
        language: rawValue?.language,
      },
    };
  }

  return {
    type: dataType,
    content: {
      value: rawValue,
    },
  };
}

function normalizeQualifier(snak: any, labels: LabelMap): WikidataQualifier {
  return {
    property: {
      id: snak.property,
      label: labels[snak.property] || snak.property,
      data_type: snak.datatype || null,
    },
    value: normalizeSnakValue(snak, labels),
  };
}

function normalizeReferencePart(snak: any, labels: LabelMap): WikidataReference["parts"][number] {
  return {
    property: {
      id: snak.property,
      label: labels[snak.property] || snak.property,
      data_type: snak.datatype || null,
    },
    value: normalizeSnakValue(snak, labels),
  };
}

function normalizeClaims(claims: Record<string, any[]> = {}, labels: LabelMap): Record<string, WikidataStatement[]> {
  return Object.fromEntries(
    Object.entries(claims).map(([propertyId, propertyClaims]) => [
      propertyId,
      propertyClaims.map((claim) => ({
        id: claim.id,
        rank: claim.rank || "normal",
        propertyId,
        explorable: true,
        property: {
          id: propertyId,
          label: labels[propertyId] || propertyId,
          data_type: claim.mainsnak?.datatype || null,
        },
        value: normalizeSnakValue(claim.mainsnak, labels),
        qualifiers: Object.values(claim.qualifiers || {})
          .flat()
          .map((qualifier: any) => normalizeQualifier(qualifier, labels)),
        references: (claim.references || []).map((reference: any) => ({
          hash: reference.hash,
          parts: Object.values(reference.snaks || {})
            .flat()
            .map((snak: any) => normalizeReferencePart(snak, labels)),
        })),
      })),
    ]),
  );
}

export class WikidataClient {
  private async fetchWithHeaders(url: string, options: RequestInit = {}) {
    const headers = {
      Accept: "application/json",
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 304) {
      return null;
    }

    if (!response.ok) {
      let message = response.statusText;
      try {
        const error = await response.json();
        message = error.message || error.error?.info || message;
      } catch {
        // Keep the HTTP status text when the body is not JSON.
      }
      throw new Error(`Wikidata request failed: ${message}`);
    }

    const data = await response.json();
    return {
      data,
      etag: response.headers.get("ETag"),
      lastModified: response.headers.get("Last-Modified"),
    };
  }

  async getEntity(id: string, fields?: string[]) {
    const fieldsParam = fields ? `?_fields=${fields.join(",")}` : "";
    const entityType = id.startsWith("P") ? "properties" : "items";
    const url = `${REST_BASE_URL}/entities/${entityType}/${id}${fieldsParam}`;

    const response = await this.fetchWithHeaders(url);
    return response?.data;
  }

  async getItem(id: string): Promise<WikidataItem> {
    return this.getDetailedEntity(id);
  }

  async getProperty(id: string): Promise<WikidataItem> {
    return this.getDetailedEntity(id);
  }

  async searchEntities(searchTerm: string): Promise<WikidataItem[]> {
    const response = await fetch(
      `${API_BASE_URL}?${new URLSearchParams({
        action: "wbsearchentities",
        search: searchTerm,
        language: "en",
        format: "json",
        origin: "*",
        limit: "20",
      })}`,
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();

    return (data.search || []).map((item: any) => ({
      id: item.id,
      type: item.id?.startsWith("P") ? "property" : "item",
      labels: { en: item.label || item.id },
      descriptions: { en: item.description || "" },
      aliases: { en: item.aliases || [] },
      statements: {},
      sitelinks: {},
    }));
  }

  async getDetailedEntity(id: string): Promise<WikidataItem> {
    const response = await fetch(
      `${API_BASE_URL}?${new URLSearchParams({
        action: "wbgetentities",
        ids: id,
        format: "json",
        origin: "*",
        props: "labels|descriptions|aliases|claims|sitelinks",
      })}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch entity ${id}: ${response.statusText}`);
    }

    const data = await response.json();
    const entity = data.entities?.[id];

    if (!entity || entity.missing) {
      throw new Error(`No Wikidata entity found for ${id}`);
    }

    const labels = await this.getLabels(collectIdsFromClaims(entity.claims));

    return {
      id: entity.id,
      type: entity.type,
      labels: normalizeLanguageMap(entity.labels),
      descriptions: normalizeLanguageMap(entity.descriptions),
      aliases: normalizeAliases(entity.aliases),
      statements: normalizeClaims(entity.claims, labels),
      sitelinks: normalizeSitelinks(entity.sitelinks),
    };
  }

  async getItemLabels(id: string): Promise<Record<string, string>> {
    const response = await fetch(`${REST_BASE_URL}/entities/items/${id}/labels`);
    if (!response.ok) {
      throw new Error(`Failed to fetch labels for ${id}: ${response.statusText}`);
    }
    return await response.json();
  }

  async fetchLabelsForIds(ids: string[], lang: string = "en"): Promise<Record<string, string>> {
    return this.getLabels(ids, lang);
  }

  async fetchCommonsMedia(files: string[]): Promise<Record<string, WikidataMediaInfo>> {
    if (!files.length) return {};

    const normalizedFiles = files.map((file) =>
      file.startsWith("File:") ? file : `File:${file}`,
    );

    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
        action: "query",
        prop: "imageinfo",
        iiprop: "url|size|mime|mediatype|metadata",
        titles: normalizedFiles.join("|"),
        format: "json",
        origin: "*",
      })}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch media metadata: ${response.statusText}`);
    }

    const data = await response.json();
    const mediaInfo: Record<string, WikidataMediaInfo> = {};

    Object.values(data.query?.pages || {}).forEach((page: any) => {
      if (page.imageinfo?.[0]) {
        const info = page.imageinfo[0];
        mediaInfo[page.title] = {
          mediatype: info.mediatype || "OTHER",
          mime: info.mime,
          url: info.url,
          title: page.title,
          size: info.size,
          width: info.width,
          height: info.height,
          duration: info.duration,
        };
      }
    });

    return mediaInfo;
  }

  async fetchAvailableLanguages(): Promise<Record<string, WikidataLanguage>> {
    const response = await fetch(
      `https://www.wikidata.org/w/api.php?${new URLSearchParams({
        action: "query",
        meta: "wbcontentlanguages",
        wbclprop: "code|name",
        format: "json",
        origin: "*",
      })}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Wikidata languages: ${response.statusText}`);
    }

    const data = await response.json();
    return data.query?.wbcontentlanguages || {};
  }

  getAllIdsFromItem(item: WikidataItem): string[] {
    const ids = new Set<string>([item.id]);

    Object.entries(item.statements || {}).forEach(([propId, claims]) => {
      ids.add(propId);
      claims.forEach((claim) => {
        if (claim.value.content?.id) ids.add(claim.value.content.id);
        claim.qualifiers.forEach((qualifier) => {
          ids.add(qualifier.property.id);
          if (qualifier.value.content?.id) ids.add(qualifier.value.content.id);
        });
      });
    });

    return Array.from(ids);
  }

  async getLabels(ids: string[], lang: string = "en"): Promise<Record<string, string>> {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (!uniqueIds.length) return {};

    const chunks: string[][] = [];
    for (let i = 0; i < uniqueIds.length; i += 50) {
      chunks.push(uniqueIds.slice(i, i + 50));
    }

    const labelEntries = await Promise.all(
      chunks.map(async (chunk) => {
        const response = await fetch(
          `https://www.wikidata.org/w/api.php?${new URLSearchParams({
            action: "wbgetentities",
            ids: chunk.join("|"),
            props: "labels",
            languages: lang,
            format: "json",
            origin: "*",
          })}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch labels: ${response.statusText}`);
        }

        const data = await response.json();
        return Object.entries(data.entities || {}).map(([entityId, entity]: [string, any]) => [
          entityId,
          entity?.labels?.[lang]?.value || entityId,
        ]);
      }),
    );

    return Object.fromEntries(labelEntries.flat());
  }
}

export async function searchWikidata(searchTerm: string): Promise<WikidataItem[]> {
  const client = new WikidataClient();
  return client.searchEntities(searchTerm);
}