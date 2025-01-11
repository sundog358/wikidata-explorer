import { z } from "zod";

// --- Type Definitions ---
export type WikidataItem = {
  id: string;
  type: "item" | "property";
  labels: Record<string, string>;
  descriptions: Record<string, string>;
  aliases: Record<string, string[]>;
  statements: Record<string, WikidataStatement[]>;
  sitelinks: Record<string, WikidataSitelink>;
  modified?: string;
};

export type WikidataStatement = {
  id: string;
  rank: "deprecated" | "normal" | "preferred";
  property: {
    id: string;
    data_type: string | null;
  };
  value: {
    type: "value" | "somevalue" | "novalue";
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
    data_type: string | null;
  };
  value: {
    type: "value" | "somevalue" | "novalue";
    content?: any;
  };
};

export type WikidataReference = {
  hash: string;
  parts: {
    property: {
      id: string;
      data_type: string | null;
    };
    value: {
      type: "value" | "somevalue" | "novalue";
      content?: any;
    };
  }[];
};

// --- API Client Class ---
export class WikidataClient {
  private baseUrl: string;

  constructor(baseUrl = "https://www.wikidata.org/w/rest.php/wikibase/v1") {
    this.baseUrl = baseUrl;
  }

  // Get detailed item info
  async getEntity(id: string): Promise<WikidataItem> {
    const entityType = id.startsWith("P") ? "properties" : "items";
    const response = await fetch(
      `${this.baseUrl}/entities/${entityType}/${id}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch entity ${id}: ${response.statusText}`);
    }
    return await response.json();
  }

  // Get item statements
  async getItemStatements(
    id: string,
    propertyId?: string
  ): Promise<Record<string, WikidataStatement[]>> {
    const url = new URL(`${this.baseUrl}/entities/items/${id}/statements`);
    if (propertyId) {
      url.searchParams.append("property", propertyId);
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `Failed to fetch statements for ${id}: ${response.statusText}`
      );
    }
    return await response.json();
  }

  // Get item labels
  async getItemLabels(id: string): Promise<Record<string, string>> {
    const response = await fetch(`${this.baseUrl}/entities/items/${id}/labels`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch labels for ${id}: ${response.statusText}`
      );
    }
    return await response.json();
  }

  // Search entities (using action API since REST API doesn't have search endpoint yet)
  async searchEntities(searchTerm: string): Promise<WikidataItem[]> {
    try {
      // First search for items
      const itemResponse = await fetch(
        `https://www.wikidata.org/w/api.php?` +
          new URLSearchParams({
            action: "wbsearchentities",
            search: searchTerm,
            language: "en",
            format: "json",
            origin: "*",
            type: "item",
            limit: "10",
            uselang: "en",
          }).toString()
      );

      // Then search for properties
      const propertyResponse = await fetch(
        `https://www.wikidata.org/w/api.php?` +
          new URLSearchParams({
            action: "wbsearchentities",
            search: searchTerm,
            language: "en",
            format: "json",
            origin: "*",
            type: "property",
            limit: "10",
            uselang: "en",
          }).toString()
      );

      const [itemData, propertyData] = await Promise.all([
        itemResponse.json(),
        propertyResponse.json(),
      ]);

      // Combine and transform the results
      const items = (itemData.search || []).map((result: any) => ({
        id: result.id.replace(/^Q*/, "Q"),
        type: "item",
        labels: { en: result.label || result.match?.text || "" },
        descriptions: { en: result.description || "" },
        aliases: {
          en: result.aliases?.map((alias: string) => alias) || [],
        },
        statements: this.addExplorationMetadata(result.claims || {}),
        sitelinks: this.addSitelinkMetadata(result.sitelinks || {}),
        explorable: true,
      }));

      const properties = (propertyData.search || []).map((result: any) => ({
        id: result.id.replace(/^P*/, "P"),
        type: "property",
        labels: { en: result.label || result.match?.text || "" },
        descriptions: { en: result.description || "" },
        aliases: { en: result.aliases || [] },
        statements: result.claims || {},
        sitelinks: result.sitelinks || {},
        explorable: true,
      }));

      // Return combined results
      return [...items, ...properties].filter(
        (item) => item.id && item.labels.en
      );
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  }

  // Add this new method to WikidataClient class
  async getDetailedEntity(id: string): Promise<WikidataItem> {
    try {
      const response = await fetch(
        `https://www.wikidata.org/w/api.php?` +
          new URLSearchParams({
            action: "wbgetentities",
            ids: id,
            format: "json",
            languages: "en",
            props: "labels|descriptions|aliases|claims|sitelinks|datatype|info",
            origin: "*",
          }).toString()
      );

      const data = await response.json();
      const entity = data.entities[id];

      if (!entity) {
        throw new Error(`Entity ${id} not found`);
      }

      // Get all property IDs from claims and ensure they exist
      const propertyIds = Object.keys(entity.claims || {})
        .filter(Boolean)
        .map((id) => (id.startsWith("P") ? id : `P${id}`));

      const propertyLabels = await getPropertyLabels(propertyIds);

      // Process claims with safe property access
      const processedClaims: Record<string, any> = {};
      for (const [propId, claims] of Object.entries(entity.claims || {})) {
        if (!propId) continue;

        const propertyLabel = propertyLabels[propId] || propId;

        processedClaims[propertyLabel] = Array.isArray(claims)
          ? claims.map((claim: any) => {
              const value = this.formatClaimValue(claim.mainsnak);
              return {
                value: value || "No value",
                qualifiers: this.processQualifiers(claim.qualifiers || {}),
                references: this.processReferences(claim.references || []),
                propertyId: propId,
                entityId: value?.entityId,
                type: value?.type,
                url: value?.url,
              };
            })
          : [];
      }

      return {
        id: entity.id,
        type: entity.type || "item",
        labels: entity.labels || {},
        descriptions: entity.descriptions || {},
        aliases: {
          en: (entity.aliases?.en || []).map((alias: any) =>
            typeof alias === "object" ? alias.value || alias.text : alias
          ),
        },
        statements: processedClaims,
        sitelinks: this.processSitelinks(entity.sitelinks || {}),
        modified: entity.modified,
      };
    } catch (error) {
      console.error("Error fetching detailed entity:", error);
      throw error;
    }
  }

  // Add these helper methods to WikidataClient class
  private formatClaimValue(mainsnak: any): any {
    if (!mainsnak || mainsnak.snaktype !== "value" || !mainsnak.datavalue) {
      return "No value";
    }

    try {
      switch (mainsnak.datatype) {
        case "wikibase-item":
          return {
            value: mainsnak.datavalue.value?.id || "Unknown entity",
            entityId: mainsnak.datavalue.value?.id,
            type: "entity",
          };
        case "commonsMedia":
          return {
            value: mainsnak.datavalue.value,
            type: "image",
            url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
              mainsnak.datavalue.value
            )}`,
          };
        default:
          return mainsnak.datavalue.value || "Unknown value";
      }
    } catch (error) {
      console.error("Error formatting claim value:", error);
      return "Error formatting value";
    }
  }

  private processQualifiers(
    qualifiers: Record<string, any[]>
  ): Record<string, string[]> {
    const processed: Record<string, string[]> = {};
    for (const [propId, quals] of Object.entries(qualifiers)) {
      processed[propId] = quals.map((q) => this.formatClaimValue(q));
    }
    return processed;
  }

  private processReferences(references: any[]): any[] {
    return references.map((ref) => {
      const processed: Record<string, string[]> = {};
      for (const [propId, snaks] of Object.entries(ref.snaks || {})) {
        processed[propId] = (snaks as any[]).map((snak) =>
          this.formatClaimValue(snak)
        );
      }
      return processed;
    });
  }

  private processSitelinks(
    sitelinks: Record<string, any>
  ): Record<string, WikidataSitelink> {
    const processed: Record<string, WikidataSitelink> = {};
    for (const [site, link] of Object.entries(sitelinks)) {
      processed[site] = {
        title: link.title,
        badges: link.badges || [],
        url: `https://${site}.wikipedia.org/wiki/${encodeURIComponent(
          link.title
        )}`,
      };
    }
    return processed;
  }

  private addExplorationMetadata(
    claims: Record<string, any>
  ): Record<string, any> {
    const processed: Record<string, any> = {};
    for (const [propId, claimValues] of Object.entries(claims)) {
      processed[propId] = Array.isArray(claimValues)
        ? claimValues.map((claim) => ({
            ...claim,
            explorable: true,
            entityId: claim.mainsnak?.datavalue?.value?.id || null,
            propertyId: propId,
          }))
        : [];
    }
    return processed;
  }

  private addSitelinkMetadata(
    sitelinks: Record<string, any>
  ): Record<string, WikidataSitelink> {
    const processed: Record<string, WikidataSitelink> = {};
    for (const [site, link] of Object.entries(sitelinks)) {
      processed[site] = {
        ...link,
        explorable: true,
        url: `https://${site}.wikipedia.org/wiki/${encodeURIComponent(
          link.title
        )}`,
        wikidataUrl: `https://www.wikidata.org/wiki/${link.title}`,
      };
    }
    return processed;
  }
}

// --- Search Function ---
export async function searchWikidata(
  searchTerm: string
): Promise<WikidataItem[]> {
  const client = new WikidataClient();
  return client.searchEntities(searchTerm);
}

// Add this helper function to format property IDs to human-readable labels
async function getPropertyLabels(
  propertyIds: string[]
): Promise<Record<string, string>> {
  if (!propertyIds.length) return {};

  try {
    const response = await fetch(
      `https://www.wikidata.org/w/api.php?` +
        new URLSearchParams({
          action: "wbgetentities",
          ids: propertyIds.join("|"),
          props: "labels",
          languages: "en",
          format: "json",
          origin: "*",
        }).toString()
    );

    const data = await response.json();
    const labels: Record<string, string> = {};

    if (data.entities) {
      Object.entries(data.entities).forEach(([id, entity]: [string, any]) => {
        labels[id] = entity?.labels?.en?.value || id;
      });
    }

    return labels;
  } catch (error) {
    console.error("Error fetching property labels:", error);
    return propertyIds.reduce((acc, id) => ({ ...acc, [id]: id }), {});
  }
}
