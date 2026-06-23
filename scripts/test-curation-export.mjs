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
    status: "checking_sources",
    statusLabel: "Checking sources",
    sourceHints: [],
  },
  {
    entityId: "Q42",
    propertyId: "P31",
    propertyLabel: "instance of",
    severity: "high",
    title: "Deprecated statement needs review",
    detail: "instance of is marked deprecated.",
    value: "human (Q5)",
    status: "ready_to_draft",
    statusLabel: "Ready to draft",
    sourceHints: [
      {
        propertyId: "P248",
        propertyLabel: "stated in",
        value: "Encyclopaedia Britannica (Q455)",
        kind: "stated-in",
        url: "https://www.wikidata.org/wiki/Q455",
        referenceHash: "abc123",
      },
      {
        propertyId: "P854",
        propertyLabel: "reference URL",
        value: "https://example.org/source",
        kind: "source-url",
        url: "https://example.org/source",
        referenceHash: "abc123",
      },
    ],
  },
];

const createdAt = "2026-06-22T00:00:00.000Z";
const quickStatements = buildQuickStatementsReviewDraft(items, { entityId: "Q42", entityLabel: "Douglas Adams", createdAt });
assert.match(quickStatements, /QuickStatements review draft/);
assert.match(quickStatements, /draft-only/);
assert.match(quickStatements, /# Q42\tP106\twriter \(Q36180\)\tS248\tSOURCE_TO_ADD\tChecking sources; medium: Claim has no references/);
assert.match(quickStatements, /# status: Ready to draft/);
assert.match(quickStatements, /# source hints: Stated in: stated in \(P248\) = Encyclopaedia Britannica \(Q455\) \(https:\/\/www\.wikidata\.org\/wiki\/Q455\); Source URL: reference URL \(P854\) = https:\/\/example\.org\/source/);
assert.equal(quickStatements.split("\n").filter((line) => line.trim() && !line.startsWith("#")).length, 0);

const markdown = buildReviewMarkdownExport(items, { entityId: "Q42", entityLabel: "Douglas Adams", createdAt });
assert.match(markdown, /# Wikidata Review Queue: Douglas Adams \(Q42\)/);
assert.match(markdown, /\| Status \| Severity \| Property \| Value \| Finding \| Source hints \| Next action \|/);
assert.match(markdown, /\| Checking sources \| medium \| occupation \(P106\) \| writer \(Q36180\) \| Claim has no references \| No source hints available \|/);
assert.match(markdown, /\| Ready to draft \| high \| instance of \(P31\).*Stated in: stated in \(P248\) = Encyclopaedia Britannica \(Q455\) \(https:\/\/www\.wikidata\.org\/wiki\/Q455\); Source URL: reference URL \(P854\) = https:\/\/example\.org\/source/);
assert.match(markdown, /Safety Checklist/);

const emptyDraft = buildQuickStatementsReviewDraft([], { entityId: "Q1", createdAt });
assert.match(emptyDraft, /No review queue items/);

console.log("PASS curation export tests");



