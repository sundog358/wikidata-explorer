import type { WikidataStatement } from "@/lib/wikidata";

export type ReviewSourceHintKind = "source-url" | "stated-in" | "retrieved" | "external-id" | "reference-value";

export type ReviewSourceHint = {
  propertyId: string;
  propertyLabel: string;
  value: string;
  kind: ReviewSourceHintKind;
  url?: string;
  referenceHash?: string;
};

export function sourceHintValueText(value: { type?: string; content?: any } | null | undefined): string;
export function sourceHintKind(part: WikidataStatement["references"][number]["parts"][number] | null | undefined): ReviewSourceHintKind;
export function sourceHintUrl(part: WikidataStatement["references"][number]["parts"][number] | null | undefined): string;
export function sourceHintKindLabel(kind: ReviewSourceHintKind | string | null | undefined): string;
export function formatSourceHint(hint: ReviewSourceHint | null | undefined): string;
export function sourceHintSummary(hints: ReviewSourceHint[] | null | undefined): string;
export function sourceHintsFromStatement(statement: WikidataStatement | null | undefined, options?: { limit?: number } | number): ReviewSourceHint[];
