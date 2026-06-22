import assert from "node:assert/strict";
import { entityIdFromDatavalue, sitelinkUrl } from "../lib/wikidata-utils.mjs";

assert.equal(entityIdFromDatavalue({ "entity-type": "item", "numeric-id": 42 }), "Q42");
assert.equal(entityIdFromDatavalue({ "entity-type": "property", "numeric-id": 31 }), "P31");
assert.equal(entityIdFromDatavalue({ id: "Q5" }), "Q5");
assert.equal(entityIdFromDatavalue(null), null);
assert.equal(sitelinkUrl("enwiki", "Douglas Adams"), "https://en.wikipedia.org/wiki/Douglas_Adams");
assert.equal(sitelinkUrl("commonswiki", "File:Example image.jpg"), "https://commons.wikimedia.org/wiki/File%3AExample_image.jpg");
assert.equal(sitelinkUrl("metawiki", "Knowledge graph"), "https://meta.wikipedia.org/wiki/Knowledge_graph");
assert.equal(sitelinkUrl("unknownsite", "Linked data"), "https://www.wikidata.org/wiki/Linked_data");

console.log("PASS wikidata utility tests");