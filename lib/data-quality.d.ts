import type { WikidataItem } from "@/lib/wikidata";

export type EntityDataQualitySummary = {
  statementCount: number;
  propertyCount: number;
  deprecatedStatementCount: number;
  preferredStatementCount: number;
  referencedStatementCount: number;
  unreferencedStatementCount: number;
  qualifiedStatementCount: number;
  referenceCount: number;
  qualifierCount: number;
  sourceHintCount: number;
  sourceLinkCount: number;
  sourceLinkedStatementCount: number;
  referencedCoverage: number;
  sourceLinkCoverage: number;
  score: number;
  rating: "Strong" | "Mixed" | "Needs review";
  issues: string[];
  strengths: string[];
};

export function summarizeEntityDataQuality(item: WikidataItem | null | undefined): EntityDataQualitySummary;
