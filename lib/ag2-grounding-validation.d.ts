export const AG2_GROUNDING_ERROR_MESSAGE: string;

export type Ag2GroundingValidation = {
  ok: boolean;
  errors: string[];
  hasGroundingReferences: boolean;
  expectedIds: string[];
  citedIds: string[];
  matchedIds: string[];
  requiredMissingIds: string[];
};

export function collectAg2GroundingIds(value: unknown, options?: { maxIds?: number }): string[];
export function validateAg2Grounding(
  responseText: unknown,
  context?: unknown,
  options?: {
    expectedIds?: string[];
    requiredIds?: string[];
    minimumMatchedIds?: number;
  },
): Ag2GroundingValidation;
export function assertAg2Grounding(
  responseText: unknown,
  context?: unknown,
  options?: {
    expectedIds?: string[];
    requiredIds?: string[];
    minimumMatchedIds?: number;
  },
): Ag2GroundingValidation;
