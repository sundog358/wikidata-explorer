export type Ag2Payload =
  | {
      mode: "entity_summary";
      entity: unknown;
    }
  | {
      mode: "workflow";
      action: "research" | "graph" | "suggest" | "verify" | "compare" | "report";
      entity?: unknown;
      entityId?: string;
      compareEntityId?: string;
      graphFocus?: {
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
      };
    }
  | {
      mode: "chat";
      messages: Array<{ role: string; content: string }>;
      context?: unknown;
    };

export type Ag2Result = {
  ok?: boolean;
  status?: number;
  error?: string;
  detail?: string;
  summary?: string;
  message?: string;
  result?: string;
};

export type RunRemoteAg2AgentOptions = {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export function ag2ServiceUrl(env?: Record<string, string | undefined>): string | null;
export function runRemoteAg2Agent(payload: Ag2Payload, options?: RunRemoteAg2AgentOptions): Promise<Ag2Result>;
