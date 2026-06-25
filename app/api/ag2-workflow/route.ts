import { z } from "zod";
import { aiAgentsEnabled, AI_DISABLED_MESSAGE } from "@/lib/ai-feature-flags.mjs";
import { aiRateLimitKey, AI_RATE_LIMIT_MESSAGE, checkAiRateLimit } from "@/lib/ai-rate-limit.mjs";
import { Ag2BridgeError } from "@/lib/ag2-errors.mjs";
import { AG2_GROUNDING_ERROR_MESSAGE, validateAg2Grounding } from "@/lib/ag2-grounding-validation.mjs";
import { evaluateAutonomyAction } from "@/lib/autonomy-safety.mjs";
import { API_FAILURE_CATEGORIES, logApiFailure } from "@/lib/api-observability.mjs";

export const runtime = "nodejs";
export const maxDuration = 60;
const ROUTE_NAME = "/api/ag2-workflow";

function aiRateLimitResponse(req: Request) {
  const limit = checkAiRateLimit({
    key: aiRateLimitKey(req.headers),
    env: process.env,
  });

  if (limit.allowed) return null;

  logApiFailure({
    route: ROUTE_NAME,
    status: 429,
    category: API_FAILURE_CATEGORIES.REQUEST_RATE_LIMITED,
    message: AI_RATE_LIMIT_MESSAGE,
  });

  return Response.json(
    { error: AI_RATE_LIMIT_MESSAGE },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil(limit.retryAfterMs / 1000))) },
    },
  );
}

const referencePartSchema = z.object({
  propertyId: z.string().max(20),
  propertyLabel: z.string().max(200),
  value: z.string().max(800),
});

const statementSchema = z.object({
  propertyId: z.string().max(20),
  propertyLabel: z.string().max(200),
  rank: z.enum(["deprecated", "normal", "preferred"]),
  value: z.string().max(1000),
  qualifiers: z.array(referencePartSchema).max(6),
  references: z.array(z.object({
    hash: z.string().max(120).optional(),
    parts: z.array(referencePartSchema).max(6),
  })).max(4),
});

const entitySchema = z.object({
  id: z.string().regex(/^[QP]\d+$/),
  type: z.enum(["item", "property"]),
  label: z.string().min(1).max(200),
  description: z.string().max(1200),
  statements: z.array(statementSchema).min(1).max(20),
});

const graphFocusSchema = z.object({
  id: z.string().regex(/^[QP]\d+$/),
  label: z.string().min(1).max(200),
  property: z.string().min(1).max(200),
  propertyId: z.string().regex(/^P\d+$/),
  kind: z.enum(["item", "property"]),
  rank: z.enum(["deprecated", "normal", "preferred"]),
  dataType: z.string().max(80).nullable(),
  qualifierCount: z.number().int().min(0).max(999),
  referenceCount: z.number().int().min(0).max(999),
  statementId: z.string().max(200).nullable(),
  value: z.string().min(1).max(500),
}).strict();

const requestSchema = z.object({
  action: z.enum(["research", "graph", "suggest", "verify", "compare", "report"]),
  entity: entitySchema.optional(),
  entityId: z.string().regex(/^[QP]\d+$/).optional(),
  compareEntityId: z.string().regex(/^[QP]\d+$/).optional(),
  graphFocus: graphFocusSchema.optional(),
});

export async function POST(req: Request) {
  if (!aiAgentsEnabled({ ENABLE_AI_AGENTS: process.env.ENABLE_AI_AGENTS })) {
    logApiFailure({
      route: ROUTE_NAME,
      status: 404,
      category: API_FAILURE_CATEGORIES.AG2_DISABLED,
      message: AI_DISABLED_MESSAGE,
    });
    return Response.json({ error: AI_DISABLED_MESSAGE }, { status: 404 });
  }

  const limited = aiRateLimitResponse(req);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    logApiFailure({
      route: ROUTE_NAME,
      status: 400,
      category: API_FAILURE_CATEGORIES.REQUEST_VALIDATION,
      message: "Request body must be valid JSON.",
    });
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    logApiFailure({
      route: ROUTE_NAME,
      status: 400,
      category: API_FAILURE_CATEGORIES.REQUEST_VALIDATION,
      message: "Invalid AG2 workflow request.",
    });
    return Response.json(
      { error: "Invalid AG2 workflow request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { action, entity, entityId, compareEntityId, graphFocus } = parsed.data;
  const safety = evaluateAutonomyAction({
    action,
    mode: "read_only",
    entityId: entityId || entity?.id,
    compareEntityId,
    batchSize: 1,
    dryRun: true,
  });

  if (!safety.allowed) {
    logApiFailure({
      route: ROUTE_NAME,
      status: 403,
      category: API_FAILURE_CATEGORIES.SAFETY_POLICY,
      message: "Autonomy safety policy blocked this workflow.",
    });
    return Response.json(
      { error: "Autonomy safety policy blocked this workflow.", safety },
      { status: 403 },
    );
  }

  if (action !== "research" && !entity) {
    logApiFailure({
      route: ROUTE_NAME,
      status: 400,
      category: API_FAILURE_CATEGORIES.REQUEST_VALIDATION,
      message: "This AG2 workflow requires visible entity context.",
    });
    return Response.json(
      { error: "This AG2 workflow requires visible entity context." },
      { status: 400 },
    );
  }
  if (action === "compare" && !compareEntityId) {
    logApiFailure({
      route: ROUTE_NAME,
      status: 400,
      category: API_FAILURE_CATEGORIES.REQUEST_VALIDATION,
      message: "Comparison requires a second Wikidata entity ID.",
    });
    return Response.json(
      { error: "Comparison requires a second Wikidata entity ID." },
      { status: 400 },
    );
  }

  try {
    const { runAg2Agent } = await import("@/lib/ag2");
    const result = await runAg2Agent({
      mode: "workflow",
      action,
      entity,
      entityId: entityId || entity?.id,
      compareEntityId,
      graphFocus,
    });
    const requiredIds = [entityId || entity?.id].filter((id): id is string => Boolean(id));
    const grounding = validateAg2Grounding(result.result, { action, entity, entityId, compareEntityId, graphFocus }, {
      requiredIds,
    });
    if (!grounding.ok) {
      throw new Ag2BridgeError(AG2_GROUNDING_ERROR_MESSAGE, 502);
    }
    return Response.json({ result: result.result, safety, grounding });
  } catch (error) {
    logApiFailure({
      route: ROUTE_NAME,
      status: error instanceof Ag2BridgeError ? error.status : 500,
      error,
    });
    if (error instanceof Ag2BridgeError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: "The AG2 workflow service could not complete the response." },
      { status: 500 },
    );
  }
}


