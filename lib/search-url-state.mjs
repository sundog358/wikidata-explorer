const DEFAULT_GRAPH_FILTERS = Object.freeze({
  kind: "all",
  rank: "all",
  propertyId: "all",
  evidence: "all",
});

const SEARCH_TABS = new Set(["graph", "statements", "aliases", "media", "languages", "links", "agent-runs", "review"]);
const GRAPH_KINDS = new Set(["all", "item", "property"]);
const GRAPH_RANKS = new Set(["all", "preferred", "normal", "deprecated"]);
const GRAPH_EVIDENCE = new Set(["all", "referenced", "unreferenced", "qualified"]);

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

export function readSearchWorkbenchState(input) {
  const params = paramsFrom(input);
  const tab = validValue(params, "tab", SEARCH_TABS, "graph");

  return {
    tab,
    graphFilters: {
      kind: validValue(params, "gkind", GRAPH_KINDS, DEFAULT_GRAPH_FILTERS.kind),
      rank: validValue(params, "grank", GRAPH_RANKS, DEFAULT_GRAPH_FILTERS.rank),
      propertyId: validPropertyId(params),
      evidence: validValue(params, "gevidence", GRAPH_EVIDENCE, DEFAULT_GRAPH_FILTERS.evidence),
    },
  };
}

function setOrDelete(params, key, value, defaultValue) {
  if (!value || value === defaultValue) {
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

  setOrDelete(params, "tab", tab, "graph");
  setOrDelete(params, "gkind", graphFilters.kind, DEFAULT_GRAPH_FILTERS.kind);
  setOrDelete(params, "grank", graphFilters.rank, DEFAULT_GRAPH_FILTERS.rank);
  setOrDelete(params, "gprop", graphFilters.propertyId, DEFAULT_GRAPH_FILTERS.propertyId);
  setOrDelete(params, "gevidence", graphFilters.evidence, DEFAULT_GRAPH_FILTERS.evidence);

  return params;
}

export { DEFAULT_GRAPH_FILTERS };

