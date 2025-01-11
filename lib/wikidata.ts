import { z } from 'zod';

// API Types
export const WikibasePropertySchema = z.object({
  id: z.string(),
  type: z.literal('property'),
  data_type: z.string(),
  labels: z.record(z.string()),
  descriptions: z.record(z.string()),
  aliases: z.record(z.array(z.string())),
  statements: z.record(z.array(z.any()))
});

export const WikibaseItemSchema = z.object({
  id: z.string(),
  type: z.literal('item'),
  labels: z.record(z.string()),
  descriptions: z.record(z.string()),
  aliases: z.record(z.array(z.string())),
  statements: z.record(z.array(z.any())),
  sitelinks: z.record(z.object({
    title: z.string(),
    badges: z.array(z.string()),
    url: z.string()
  }))
});

// API Client
export class WikidataClient {
  private baseUrl: string;

  constructor(baseUrl = 'https://www.wikidata.org/w/rest.php/wikibase/v1') {
    this.baseUrl = baseUrl;
  }

  async getItem(id: string) {
    const response = await fetch(`${this.baseUrl}/entities/items/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch item ${id}`);
    const data = await response.json();
    return WikibaseItemSchema.parse(data);
  }

  async getProperty(id: string) {
    const response = await fetch(`${this.baseUrl}/entities/properties/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch property ${id}`);
    const data = await response.json();
    return WikibasePropertySchema.parse(data);
  }

  async searchEntities(query: string, language = 'en', limit = 10) {
    const params = new URLSearchParams({
      search: query,
      language,
      limit: limit.toString()
    });
    const response = await fetch(`${this.baseUrl}/search/entities?${params}`);
    if (!response.ok) throw new Error('Search failed');
    return await response.json();
  }
}

// Singleton instance
export const wikidataClient = new WikidataClient();