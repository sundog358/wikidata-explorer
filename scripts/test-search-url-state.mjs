import assert from "node:assert/strict";
import { readSearchWorkbenchState, writeSearchWorkbenchState } from "../lib/search-url-state.mjs";

const defaultState = readSearchWorkbenchState("?q=Q42");
assert.equal(defaultState.tab, "graph");
assert.deepEqual(defaultState.graphFilters, { depth: "1", layout: "radial", kind: "all", rank: "all", propertyId: "all", evidence: "all" });
assert.equal(defaultState.graphFocusId, null);
assert.equal(defaultState.comparisonTargetId, null);

const state = readSearchWorkbenchState("?q=Q42&tab=compare&compare=q80&gdepth=property&glayout=timeline&gkind=item&grank=normal&gprop=p31&gevidence=referenced&gfocus=q5");
assert.equal(state.tab, "compare");
assert.deepEqual(state.graphFilters, { depth: "property", layout: "timeline", kind: "item", rank: "normal", propertyId: "P31", evidence: "referenced" });
assert.equal(state.graphFocusId, "Q5");
assert.equal(state.comparisonTargetId, "Q80");

const invalid = readSearchWorkbenchState("?tab=bad&compare=bad&gdepth=wide&glayout=spiral&gkind=unknown&grank=old&gprop=Q42&gevidence=nope&gfocus=bad");
assert.equal(invalid.tab, "graph");
assert.deepEqual(invalid.graphFilters, { depth: "1", layout: "radial", kind: "all", rank: "all", propertyId: "all", evidence: "all" });
assert.equal(invalid.graphFocusId, null);
assert.equal(invalid.comparisonTargetId, null);

const updated = writeSearchWorkbenchState("?q=Q42&agent=graph", {
  tab: "statements",
  graphFilters: { depth: "2", layout: "timeline", kind: "property", rank: "preferred", propertyId: "P279", evidence: "qualified" },
  graphFocusId: "P361",
  comparisonTargetId: "Q80",
});
assert.equal(updated.get("q"), "Q42");
assert.equal(updated.get("agent"), "graph");
assert.equal(updated.get("tab"), "statements");
assert.equal(updated.get("gdepth"), "2");
assert.equal(updated.get("glayout"), "timeline");
assert.equal(updated.get("gkind"), "property");
assert.equal(updated.get("grank"), "preferred");
assert.equal(updated.get("gprop"), "P279");
assert.equal(updated.get("gevidence"), "qualified");
assert.equal(updated.get("gfocus"), "P361");
assert.equal(updated.get("compare"), "Q80");

const cleaned = writeSearchWorkbenchState(updated, { tab: "graph", graphFilters: { depth: "1", layout: "radial", kind: "all", rank: "all", propertyId: "all", evidence: "all" }, graphFocusId: null, comparisonTargetId: null });
assert.equal(cleaned.get("q"), "Q42");
assert.equal(cleaned.has("tab"), false);
assert.equal(cleaned.has("gdepth"), false);
assert.equal(cleaned.has("glayout"), false);
assert.equal(cleaned.has("gkind"), false);
assert.equal(cleaned.has("grank"), false);
assert.equal(cleaned.has("gprop"), false);
assert.equal(cleaned.has("gevidence"), false);
assert.equal(cleaned.has("gfocus"), false);
assert.equal(cleaned.has("compare"), false);

console.log("PASS search URL state tests");
