import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tracePath = new URL("../.next/server/app/api/entity-summary/route.js.nft.json", import.meta.url);
const trace = JSON.parse(await readFile(tracePath, "utf8"));
const files = trace.files || [];

const includes = (pattern) => files.some((file) => file.includes(pattern));
const includesAny = (patterns) => patterns.some((pattern) => includes(pattern));

assert.ok(includes("agents/wikidata_ag2_agent.py"), "AG2 Python bridge script should stay in the API route trace.");
assert.equal(includes("next.config.js"), false, "next.config.js should not be bundled into API route traces.");
assert.equal(includes("pywikibot.lwp"), false, "local Pywikibot login cache must not be bundled into API route traces.");
assert.equal(includes("user-password.py"), false, "local bot password file must not be bundled into API route traces.");
assert.equal(includesAny(["/out/", "\\out\\"]), false, "static export output should not be bundled into API route traces.");
assert.equal(includesAny(["/utils/", "\\utils\\"]), false, "legacy utility scripts should not be bundled into API route traces.");
assert.equal(includesAny(["docs/screenshots", "docs\\screenshots"]), false, "portfolio screenshots should not be bundled into API route traces.");

console.log(`PASS deployment trace excludes repo clutter (${files.length} traced files)`);