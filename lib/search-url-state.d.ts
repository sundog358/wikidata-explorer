export type SearchWorkbenchTab = "graph" | "compare" | "statements" | "aliases" | "media" | "languages" | "links" | "agent-runs" | "review";
export type SearchExportView = "graph-markdown" | "graph-json" | "comparison-markdown" | "comparison-json" | "comparison-property";

export type SearchGraphFilters = {
  depth: "1" | "2" | "property";
  layout: "radial" | "property" | "timeline";
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
  comparisonTargetId: string | null;
  comparisonThirdTargetId: string | null;
  comparisonPropertyId: string | null;
  exportView: SearchExportView | "";
};

export function writeSearchWorkbenchState(input?: string | URLSearchParams, state?: {
  tab?: SearchWorkbenchTab;
  graphFilters?: Partial<SearchGraphFilters>;
  graphFocusId?: string | null;
  comparisonTargetId?: string | null;
  comparisonThirdTargetId?: string | null;
  comparisonPropertyId?: string | null;
  exportView?: SearchExportView | null;
}): URLSearchParams;
