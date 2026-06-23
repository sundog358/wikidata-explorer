export type SearchWorkbenchTab = "graph" | "statements" | "aliases" | "media" | "languages" | "links" | "agent-runs" | "review";

export type SearchGraphFilters = {
  kind: "all" | "item" | "property";
  rank: "all" | "preferred" | "normal" | "deprecated";
  propertyId: string;
  evidence: "all" | "referenced" | "unreferenced" | "qualified";
};

export const DEFAULT_GRAPH_FILTERS: SearchGraphFilters;

export function readSearchWorkbenchState(input?: string | URLSearchParams): {
  tab: SearchWorkbenchTab;
  graphFilters: SearchGraphFilters;
};

export function writeSearchWorkbenchState(input?: string | URLSearchParams, state?: {
  tab?: SearchWorkbenchTab;
  graphFilters?: Partial<SearchGraphFilters>;
}): URLSearchParams;
