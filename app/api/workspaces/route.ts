import {
  authorizeWorkspaceStore,
  buildProjectWorkspaceAgentRunIndex,
  buildProjectWorkspaceCurationTaskIndex,
  readProjectWorkspaceSlots,
  removeProjectWorkspaceSlot,
  summarizeProjectWorkspaceAgentRuns,
  summarizeProjectWorkspaceCurationTasks,
  upsertProjectWorkspaceSlot,
} from "@/lib/workspace-store.mjs";

export const runtime = "nodejs";

function authResponse(req: Request) {
  const auth = authorizeWorkspaceStore(req.headers, process.env);
  if (auth.authorized) return { response: null, config: auth.config };

  return {
    response: Response.json(
      { error: "Workspace store is unavailable.", reason: auth.reason },
      { status: auth.status },
    ),
    config: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function readJsonObject(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, response: Response.json({ error: "Request body must be valid JSON." }, { status: 400 }), body: null };
  }

  if (!isRecord(body)) {
    return { ok: false, response: Response.json({ error: "Request body must be a JSON object." }, { status: 400 }), body: null };
  }

  return { ok: true, response: null, body };
}

function workspaceStoreResponse(result: { projectId: string; slots: unknown[] }, init?: ResponseInit, options: { includeTasks?: boolean; includeAgentRuns?: boolean } = {}) {
  const body: Record<string, unknown> = {
    projectId: result.projectId,
    slots: result.slots,
  };

  if (options.includeTasks) {
    body.curationTasks = buildProjectWorkspaceCurationTaskIndex(result.slots);
    body.taskSummary = summarizeProjectWorkspaceCurationTasks(result.slots);
  }
  if (options.includeAgentRuns) {
    body.agentRuns = buildProjectWorkspaceAgentRunIndex(result.slots);
    body.agentSummary = summarizeProjectWorkspaceAgentRuns(result.slots);
  }

  return Response.json(body, init);
}

export async function GET(req: Request) {
  const { response, config } = authResponse(req);
  if (response || !config) return response;

  const url = new URL(req.url);
  const projectId = url.searchParams.get("project") || "default";
  const includeTasks = url.searchParams.get("includeTasks") === "true" || url.searchParams.get("includeTasks") === "1";
  const includeAgentRuns = url.searchParams.get("includeAgentRuns") === "true" || url.searchParams.get("includeAgentRuns") === "1";
  const result = await readProjectWorkspaceSlots({ config, projectId });
  if (!result.ok) {
    return Response.json({ error: "Workspace store could not be read.", reason: result.reason }, { status: result.status || 500 });
  }

  return workspaceStoreResponse(result, undefined, { includeTasks, includeAgentRuns });
}

export async function POST(req: Request) {
  const { response, config } = authResponse(req);
  if (response || !config) return response;

  const parsed = await readJsonObject(req);
  if (!parsed.ok || !parsed.body) return parsed.response;

  const result = await upsertProjectWorkspaceSlot({
    config,
    projectId: parsed.body.projectId,
    slot: parsed.body.slot,
  });
  if (!result.ok) {
    return Response.json({ error: "Workspace slot could not be saved.", reason: result.reason }, { status: result.status || 500 });
  }

  return workspaceStoreResponse(result, { status: 202 }, {
    includeTasks: parsed.body.includeTasks === true,
    includeAgentRuns: parsed.body.includeAgentRuns === true,
  });
}

export async function DELETE(req: Request) {
  const { response, config } = authResponse(req);
  if (response || !config) return response;

  const parsed = await readJsonObject(req);
  if (!parsed.ok || !parsed.body) return parsed.response;

  const result = await removeProjectWorkspaceSlot({
    config,
    projectId: parsed.body.projectId,
    slotId: parsed.body.slotId,
  });
  if (!result.ok) {
    return Response.json({ error: "Workspace slot could not be removed.", reason: result.reason }, { status: result.status || 500 });
  }

  return workspaceStoreResponse(result, undefined, {
    includeTasks: parsed.body.includeTasks === true,
    includeAgentRuns: parsed.body.includeAgentRuns === true,
  });
}
