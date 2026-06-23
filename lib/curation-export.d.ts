export type CurationExportItem = {
  entityId: string;
  propertyId: string;
  propertyLabel?: string;
  severity?: string;
  title?: string;
  detail?: string;
  value?: string;
};

export function buildQuickStatementsReviewDraft(items: CurationExportItem[], options?: {
  entityId?: string;
  entityLabel?: string;
  createdAt?: string | Date;
}): string;

export function buildReviewMarkdownExport(items: CurationExportItem[], options?: {
  entityId?: string;
  entityLabel?: string;
  createdAt?: string | Date;
}): string;
