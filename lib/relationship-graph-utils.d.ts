import type { WikidataItem, WikidataStatement } from "@/lib/wikidata";

export type RelationshipGraphNode = {
  id: string;
  label: string;
  property: string;
  propertyId: string;
  kind: "item" | "property";
  rank: WikidataStatement["rank"];
  dataType: string | null;
  qualifierCount: number;
  referenceCount: number;
  statement: WikidataStatement;
};

export type RelationshipGraphFilters = {
  kind?: "all" | "item" | "property";
  rank?: "all" | WikidataStatement["rank"];
  propertyId?: string;
  evidence?: "all" | "referenced" | "unreferenced" | "qualified";
};

export function collectRelationshipGraphNodes(item: WikidataItem, limit?: number): RelationshipGraphNode[];
export function graphPropertyOptions(nodes: RelationshipGraphNode[]): Array<{ id: string; label: string }>;
export function filterRelationshipGraphNodes(nodes: RelationshipGraphNode[], filters?: RelationshipGraphFilters): RelationshipGraphNode[];
export function relationshipGraphSummary(item: WikidataItem, nodes: RelationshipGraphNode[], filteredNodes: RelationshipGraphNode[]): string;