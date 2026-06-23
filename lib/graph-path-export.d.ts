export type GraphPathSource = {
  id?: string;
  entityId?: string;
  label?: string;
  entityLabel?: string;
};

export type GraphPathFocus = {
  id?: string;
  label?: string;
  property?: string;
  propertyId?: string;
  kind?: string;
  rank?: string;
  dataType?: string | null;
  qualifierCount?: number;
  referenceCount?: number;
  statementId?: string | null;
  value?: string;
};

export function buildGraphPathMarkdownExport(source: GraphPathSource, focus: GraphPathFocus | null | undefined, options?: {
  createdAt?: string | Date;
}): string;

export function buildGraphPathJsonExport(source: GraphPathSource, focus: GraphPathFocus | null | undefined, options?: {
  createdAt?: string | Date;
}): string;
