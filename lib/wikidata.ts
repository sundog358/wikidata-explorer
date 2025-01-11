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
  async getItem(id: string): Promise<WikidataItem> {
    const response = await fetch(`${this.baseUrl}/entities/items/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch item ${id}: ${response.statusText}`);
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
    const response = await fetch(
      `https://www.wikidata.org/w/api.php?` +
        new URLSearchParams({
          action: "wbsearchentities",
          search: searchTerm,
          language: "en",
          format: "json",
          origin: "*",
        })
    );

    if (!response.ok) {
      throw new Error("Failed to search Wikidata");
    }

    const data = await response.json();
    const results = await Promise.all(
      data.search.map(async (result: any) => {
        try {
          return await this.getItem(result.id);
        } catch (error) {
          console.warn(`Failed to fetch details for ${result.id}`, error);
          return null;
        }
      })
    );

    return results.filter((item): item is WikidataItem => item !== null);
  }
}

// --- Search Function ---
export async function searchWikidata(
  searchTerm: string
): Promise<WikidataItem[]> {
  const client = new WikidataClient();
  return client.searchEntities(searchTerm);
}
