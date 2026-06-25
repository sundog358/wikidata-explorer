export const AG2_CHAT_CONTEXT_STORAGE_KEY: string;

export type Ag2ChatReferencePart = {
  propertyId: string;
  propertyLabel: string;
  value: string;
};

export type Ag2ChatStatementContext = {
  statementId: string;
  propertyId: string;
  propertyLabel: string;
  rank: "deprecated" | "normal" | "preferred";
  value: string;
  qualifiers: Ag2ChatReferencePart[];
  references: Array<{
    hash: string;
    parts: Ag2ChatReferencePart[];
  }>;
};

export type Ag2ChatVisibleContext = {
  source: string;
  createdAt: string;
  entity: {
    id: string;
    type: "item" | "property";
    label: string;
    description: string;
    statements: Ag2ChatStatementContext[];
  } | null;
  graphFocus: {
    id: string;
    label: string;
    property: string;
    propertyId: string;
    kind: "item" | "property";
    rank: "deprecated" | "normal" | "preferred";
    dataType: string | null;
    qualifierCount: number;
    referenceCount: number;
    statementId: string | null;
    value: string;
  } | null;
  selectedStatements: Ag2ChatStatementContext[];
  graphPathExport: {
    markdown: string;
    json: string;
  } | null;
};

export function sanitizeChatVisibleContext(context: unknown): Ag2ChatVisibleContext | null;
