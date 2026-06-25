import assert from "node:assert/strict";
import { AG2_CHAT_CONTEXT_STORAGE_KEY, sanitizeChatVisibleContext } from "../lib/ag2-chat-context.mjs";

const context = sanitizeChatVisibleContext({
  source: "search-workbench",
  createdAt: "2026-06-25T19:40:00.000Z",
  entity: {
    id: "q42",
    type: "item",
    label: "Douglas Adams",
    description: "English author and humorist",
    statements: [
      {
        statementId: "Q42$fixture-P31-Q5",
        propertyId: "P31",
        propertyLabel: "instance of",
        rank: "preferred",
        value: "human Q5",
        qualifiers: [{ propertyId: "P580", propertyLabel: "start time", value: "1952" }],
        references: [{ hash: "abc", parts: [{ propertyId: "P248", propertyLabel: "stated in", value: "Encyclopaedia Britannica Q5375741" }] }],
      },
    ],
  },
  graphFocus: {
    id: "Q5",
    label: "human",
    property: "instance of",
    propertyId: "P31",
    kind: "item",
    rank: "preferred",
    dataType: "wikibase-item",
    qualifierCount: 1,
    referenceCount: 1,
    statementId: "Q42$fixture-P31-Q5",
    value: "human Q5",
  },
  selectedStatements: [
    { propertyId: "P31", propertyLabel: "instance of", rank: "normal", value: "human Q5", qualifiers: [], references: [] },
    { propertyId: "P106", propertyLabel: "occupation", rank: "normal", value: "writer Q36180", qualifiers: [], references: [] },
  ],
  graphPathExport: {
    markdown: "# Wikidata Explorer Graph Path\n\nQ42 -> Q5",
    json: JSON.stringify({ source: { id: "Q42" }, target: { id: "Q5" } }),
  },
});

assert.equal(AG2_CHAT_CONTEXT_STORAGE_KEY, "wikidata-explorer.ag2ChatContext.v1");
assert.ok(context);
assert.equal(context.entity.id, "Q42");
assert.equal(context.entity.statements[0].statementId, "Q42$fixture-P31-Q5");
assert.equal(context.graphFocus.id, "Q5");
assert.equal(context.graphFocus.propertyId, "P31");
assert.equal(context.selectedStatements.length, 2);
assert.match(context.graphPathExport.markdown, /Q42 -> Q5/);

const bounded = sanitizeChatVisibleContext({
  entity: {
    id: "Q1",
    label: "x".repeat(300),
    description: "d".repeat(2000),
    statements: Array.from({ length: 25 }, (_, index) => ({ propertyId: `P${index + 1}`, value: "value" })),
  },
  selectedStatements: Array.from({ length: 10 }, (_, index) => ({ propertyId: `P${index + 1}`, value: "value" })),
  graphPathExport: { markdown: "m".repeat(5000), json: "j".repeat(5000) },
});

assert.equal(bounded.entity.label.length, 200);
assert.equal(bounded.entity.description.length, 1200);
assert.equal(bounded.entity.statements.length, 16);
assert.equal(bounded.selectedStatements.length, 4);
assert.equal(bounded.graphPathExport.markdown.length, 4000);
assert.equal(bounded.graphPathExport.json.length, 4000);

assert.equal(sanitizeChatVisibleContext({ entity: { id: "not-wikidata" } }), null);
assert.equal(sanitizeChatVisibleContext({ graphFocus: { id: "Q5", propertyId: "bad" } }), null);
assert.equal(sanitizeChatVisibleContext(null), null);

console.log("PASS AG2 chat context tests");
