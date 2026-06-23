export type CurationExportSourceHint = {
  propertyId: string;
  propertyLabel: string;
  value: string;
  kind: string;
  referenceHash?: string;
};

export type CurationExportItem = {
  entityId: string;
  propertyId: string;
  propertyLabel?: string;
  severity?: string;
  title?: string;
  detail?: string;
  value?: string;
  status?: string;
  statusLabel?: string;
  sourceHints?: CurationExportSourceHint[];
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
