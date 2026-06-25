import type { WikidataItem, WikidataStatement } from "@/lib/wikidata";

export type RelationshipGraphNode = {
  id: string;
  label: string;
  property: string;
  propertyId: string;
  sourceProperty: string;
  sourcePropertyId: string;
  kind: "item" | "property";
  rank: WikidataStatement["rank"];
  dataType: string | null;
  qualifierCount: number;
  referenceCount: number;
  depth: 1 | 2;
  source: "statement" | "qualifier" | "reference";
  statement: WikidataStatement;
};

export type RelationshipGraphFilters = {
  depth?: "1" | "2" | "property";
  kind?: "all" | "item" | "property";
  rank?: "all" | WikidataStatement["rank"];
  propertyId?: string;
  evidence?: "all" | "referenced" | "unreferenced" | "qualified";
};

export type RelationshipGraphFocus = {
  id: string;
  label: string;
  property: string;
  propertyId: string;
  sourceProperty: string;
  sourcePropertyId: string;
  kind: "item" | "property";
  rank: WikidataStatement["rank"];
  dataType: string | null;
  qualifierCount: number;
  referenceCount: number;
  depth: 1 | 2;
  source: "statement" | "qualifier" | "reference";
  statementId: string | null;
  value: string;
};

export function collectRelationshipGraphNodes(item: WikidataItem, limit?: number): RelationshipGraphNode[];
export function graphPropertyOptions(nodes: RelationshipGraphNode[]): Array<{ id: string; label: string }>;
export function filterRelationshipGraphNodes(nodes: RelationshipGraphNode[], filters?: RelationshipGraphFilters): RelationshipGraphNode[];
export function graphFocusFromNode(node: RelationshipGraphNode | null | undefined): RelationshipGraphFocus | null;
export function relationshipGraphSummary(item: WikidataItem, nodes: RelationshipGraphNode[], filteredNodes: RelationshipGraphNode[]): string;
