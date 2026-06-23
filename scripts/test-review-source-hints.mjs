import assert from "node:assert/strict";
import { formatSourceHint, sourceHintKind, sourceHintsFromStatement, sourceHintSummary, sourceHintUrl, sourceHintValueText } from "../lib/review-source-hints.mjs";

const statement = {
  references: [
    {
      hash: "abc123",
      parts: [
        {
          property: { id: "P248", label: "stated in", data_type: "wikibase-item" },
          value: { type: "wikibase-item", content: { id: "Q455", label: "Encyclopaedia Britannica" } },
        },
        {
          property: { id: "P854", label: "reference URL", data_type: "url" },
          value: { type: "url", content: { value: "https://example.org/source" } },
        },
        {
          property: { id: "P813", label: "retrieved", data_type: "time" },
          value: { type: "time", content: { time: "+2026-06-22T00:00:00Z", precision: 11 } },
        },
        {
          property: { id: "P698", label: "PubMed ID", data_type: "external-id" },
          value: { type: "external-id", content: { value: "123456" } },
        },
        {
          property: { id: "P854", label: "reference URL", data_type: "url" },
          value: { type: "url", content: { value: "https://example.org/source" } },
        },
      ],
    },
  ],
};

const hints = sourceHintsFromStatement(statement);
assert.equal(hints.length, 4);
assert.equal(hints[0].kind, "stated-in");
assert.equal(hints[0].value, "Encyclopaedia Britannica (Q455)");
assert.equal(hints[0].url, "https://www.wikidata.org/wiki/Q455");
assert.equal(hints[1].kind, "source-url");
assert.equal(hints[1].url, "https://example.org/source");
assert.equal(hints[2].kind, "retrieved");
assert.equal(hints[2].value, "2026-06-22");
assert.equal(hints[2].url, "");
assert.equal(hints[3].kind, "external-id");
assert.equal(hints[3].url, "");
assert.equal(hints[3].referenceHash, "abc123");

assert.equal(sourceHintsFromStatement(statement, { limit: 2 }).length, 2);
assert.deepEqual(sourceHintsFromStatement({ references: [] }), []);
assert.equal(sourceHintKind({ property: { id: "P854", data_type: "url" }, value: { content: { value: "not a URL" } } }), "source-url");
assert.equal(sourceHintUrl({ property: { id: "P248", data_type: "wikibase-item" }, value: { content: { id: "Q42", label: "Douglas Adams" } } }), "https://www.wikidata.org/wiki/Q42");
assert.equal(sourceHintValueText({ type: "wikibase-item", content: { id: "Q42", label: "Douglas Adams" } }), "Douglas Adams (Q42)");
assert.match(formatSourceHint(hints[0]), /Stated in: stated in \(P248\) = Encyclopaedia Britannica \(Q455\) \(https:\/\/www\.wikidata\.org\/wiki\/Q455\)/);
assert.match(sourceHintSummary(hints), /Source URL: reference URL \(P854\) = https:\/\/example\.org\/source/);
assert.equal(sourceHintSummary([]), "No source hints available");

console.log("PASS review source hint tests");
