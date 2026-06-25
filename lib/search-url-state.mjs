const DEFAULT_GRAPH_FILTERS = Object.freeze({
  depth: "1",
  layout: "radial",
  kind: "all",
  rank: "all",
  propertyId: "all",
  evidence: "all",
});

const SEARCH_TABS = new Set(["graph", "compare", "statements", "aliases", "media", "languages", "links", "agent-runs", "review"]);
const GRAPH_DEPTHS = new Set(["1", "2", "property"]);
const GRAPH_LAYOUTS = new Set(["radial", "property", "timeline"]);
const GRAPH_KINDS = new Set(["all", "item", "property"]);
const GRAPH_RANKS = new Set(["all", "preferred", "normal", "deprecated"]);
const GRAPH_EVIDENCE = new Set(["all", "referenced", "unreferenced", "qualified"]);
const EXPORT_VIEWS = new Set(["graph-markdown", "graph-json", "comparison-markdown", "comparison-json"]);

function paramsFrom(input) {
  if (input instanceof URLSearchParams) return new URLSearchParams(input);
  return new URLSearchParams(String(input || "").replace(/^\?/, ""));
}

function validValue(params, key, allowed, fallback) {
  const value = params.get(key) || fallback;
  return allowed.has(value) ? value : fallback;
}

function validPropertyId(params) {
  const value = params.get("gprop") || DEFAULT_GRAPH_FILTERS.propertyId;
  if (value === "all") return DEFAULT_GRAPH_FILTERS.propertyId;
  return /^P\d+$/i.test(value) ? value.toUpperCase() : DEFAULT_GRAPH_FILTERS.propertyId;
}

function validEntityOrPropertyId(params, key) {
  const value = params.get(key) || "";
  return /^[PQ]\d+$/i.test(value) ? value.toUpperCase() : null;
}

export function readSearchWorkbenchState(input) {
  const params = paramsFrom(input);
  const tab = validValue(params, "tab", SEARCH_TABS, "graph");

  return {
    tab,
    graphFilters: {
      depth: validValue(params, "gdepth", GRAPH_DEPTHS, DEFAULT_GRAPH_FILTERS.depth),
      layout: validValue(params, "glayout", GRAPH_LAYOUTS, DEFAULT_GRAPH_FILTERS.layout),
      kind: validValue(params, "gkind", GRAPH_KINDS, DEFAULT_GRAPH_FILTERS.kind),
      rank: validValue(params, "grank", GRAPH_RANKS, DEFAULT_GRAPH_FILTERS.rank),
      propertyId: validPropertyId(params),
      evidence: validValue(params, "gevidence", GRAPH_EVIDENCE, DEFAULT_GRAPH_FILTERS.evidence),
    },
    graphFocusId: validEntityOrPropertyId(params, "gfocus"),
    comparisonTargetId: validEntityOrPropertyId(params, "compare"),
    comparisonThirdTargetId: validEntityOrPropertyId(params, "compare2"),
    exportView: validValue(params, "export", EXPORT_VIEWS, ""),
  };
}

function setOrDelete(params, key, value, defaultValue = "") {
  if (value === null || value === undefined || value === "" || value === defaultValue) {
    params.delete(key);
    return;
  }
  params.set(key, value);
}

export function writeSearchWorkbenchState(input, state = {}) {
  const params = paramsFrom(input);
  const current = readSearchWorkbenchState(params);
  const tab = state.tab || current.tab;
  const graphFilters = {
    ...current.graphFilters,
    ...(state.graphFilters || {}),
  };
  const graphFocusId = Object.prototype.hasOwnProperty.call(state, "graphFocusId") ? state.graphFocusId : current.graphFocusId;
  const comparisonTargetId = Object.prototype.hasOwnProperty.call(state, "comparisonTargetId") ? state.comparisonTargetId : current.comparisonTargetId;
  const comparisonThirdTargetId = Object.prototype.hasOwnProperty.call(state, "comparisonThirdTargetId") ? state.comparisonThirdTargetId : current.comparisonThirdTargetId;
  const exportView = Object.prototype.hasOwnProperty.call(state, "exportView") ? state.exportView : current.exportView;

  setOrDelete(params, "tab", tab, "graph");
  setOrDelete(params, "gdepth", graphFilters.depth, DEFAULT_GRAPH_FILTERS.depth);
  setOrDelete(params, "glayout", graphFilters.layout, DEFAULT_GRAPH_FILTERS.layout);
  setOrDelete(params, "gkind", graphFilters.kind, DEFAULT_GRAPH_FILTERS.kind);
  setOrDelete(params, "grank", graphFilters.rank, DEFAULT_GRAPH_FILTERS.rank);
  setOrDelete(params, "gprop", graphFilters.propertyId, DEFAULT_GRAPH_FILTERS.propertyId);
  setOrDelete(params, "gevidence", graphFilters.evidence, DEFAULT_GRAPH_FILTERS.evidence);
  setOrDelete(params, "gfocus", graphFocusId);
  setOrDelete(params, "compare", comparisonTargetId);
  setOrDelete(params, "compare2", comparisonThirdTargetId);
  setOrDelete(params, "export", exportView);

  return params;
}

export { DEFAULT_GRAPH_FILTERS };
