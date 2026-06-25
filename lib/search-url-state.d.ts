export type SearchWorkbenchTab = "graph" | "compare" | "statements" | "aliases" | "media" | "languages" | "links" | "agent-runs" | "review";

export type SearchGraphFilters = {
  depth: "1" | "2" | "property";
  layout: "radial" | "property";
  kind: "all" | "item" | "property";
  rank: "all" | "preferred" | "normal" | "deprecated";
  propertyId: string;
  evidence: "all" | "referenced" | "unreferenced" | "qualified";
};

export const DEFAULT_GRAPH_FILTERS: SearchGraphFilters;

export function readSearchWorkbenchState(input?: string | URLSearchParams): {
  tab: SearchWorkbenchTab;
  graphFilters: SearchGraphFilters;
  graphFocusId: string | null;
};

export function writeSearchWorkbenchState(input?: string | URLSearchParams, state?: {
  tab?: SearchWorkbenchTab;
  graphFilters?: Partial<SearchGraphFilters>;
  graphFocusId?: string | null;
}): URLSearchParams;
