import assert from "node:assert/strict";
import { buildQuickStatementsReviewDraft, buildReviewMarkdownExport } from "../lib/curation-export.mjs";

const items = [
  {
    entityId: "Q42",
    propertyId: "P106",
    propertyLabel: "occupation",
    severity: "medium",
    title: "Claim has no references",
    detail: "occupation has no references in the visible Wikidata statement data.",
    value: "writer (Q36180)",
  },
  {
    entityId: "Q42",
    propertyId: "P31",
    propertyLabel: "instance of",
    severity: "high",
    title: "Deprecated statement needs review",
    detail: "instance of is marked deprecated.",
    value: "human (Q5)",
  },
];

const createdAt = "2026-06-22T00:00:00.000Z";
const quickStatements = buildQuickStatementsReviewDraft(items, { entityId: "Q42", entityLabel: "Douglas Adams", createdAt });
assert.match(quickStatements, /QuickStatements review draft/);
assert.match(quickStatements, /draft-only/);
assert.match(quickStatements, /# Q42\tP106\twriter \(Q36180\)\tS248\tSOURCE_TO_ADD\tmedium: Claim has no references/);
assert.equal(quickStatements.split("\n").filter((line) => line.trim() && !line.startsWith("#")).length, 0);

const markdown = buildReviewMarkdownExport(items, { entityId: "Q42", entityLabel: "Douglas Adams", createdAt });
assert.match(markdown, /# Wikidata Review Queue: Douglas Adams \(Q42\)/);
assert.match(markdown, /\| medium \| occupation \(P106\) \| writer \(Q36180\) \| Claim has no references/);
assert.match(markdown, /Safety Checklist/);

const emptyDraft = buildQuickStatementsReviewDraft([], { entityId: "Q1", createdAt });
assert.match(emptyDraft, /No review queue items/);

console.log("PASS curation export tests");
