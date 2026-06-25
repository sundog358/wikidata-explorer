import type { WikidataItem } from "./wikidata";

export type EntityComparisonProperty = {
  id: string;
  label: string;
  count: number;
  referencedCount: number;
  qualifiedCount: number;
  valueIds: string[];
};

export type EntityComparisonEntity = {
  id: string;
  label: string;
  description: string;
  propertyCount: number;
  statementCount: number;
  referencedStatementCount: number;
  qualifiedStatementCount: number;
  sitelinkCount: number;
  languageCount: number;
};

export type EntityComparison = {
  generatedAt: string;
  source: EntityComparisonEntity;
  target: EntityComparisonEntity;
  sharedProperties: Array<{
    id: string;
    label: string;
    sourceCount: number;
    targetCount: number;
    sourceReferencedCount: number;
    targetReferencedCount: number;
  }>;
  sourceUniqueProperties: EntityComparisonProperty[];
  targetUniqueProperties: EntityComparisonProperty[];
  overlappingEntities: Array<{
    id: string;
    label: string;
    sourceProperties: string[];
    targetProperties: string[];
  }>;
};

export function buildEntityComparison(source: WikidataItem, target: WikidataItem, options?: { createdAt?: string }): EntityComparison;

export function buildEntityComparisonMarkdownExport(comparison: EntityComparison, options?: { limit?: number }): string;

export function buildEntityComparisonJsonExport(comparison: EntityComparison, options?: { limit?: number }): string;
