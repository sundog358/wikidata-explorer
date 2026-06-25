import { z } from "zod";
import { aiAgentsEnabled, AI_DISABLED_MESSAGE } from "@/lib/ai-feature-flags.mjs";
import { aiRateLimitKey, AI_RATE_LIMIT_MESSAGE, checkAiRateLimit } from "@/lib/ai-rate-limit.mjs";
import { Ag2BridgeError } from "@/lib/ag2-errors.mjs";
import { AG2_GROUNDING_ERROR_MESSAGE, validateAg2Grounding } from "@/lib/ag2-grounding-validation.mjs";
import { API_FAILURE_CATEGORIES, reportApiFailure } from "@/lib/api-observability.mjs";

export const runtime = "nodejs";
export const maxDuration = 60;
const ROUTE_NAME = "/api/entity-summary";

async function aiRateLimitResponse(req: Request) {
  const limit = checkAiRateLimit({
    key: aiRateLimitKey(req.headers),
    env: process.env,
  });

  if (limit.allowed) return null;

  await reportApiFailure({
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

const requestSchema = z.object({
  entity: z.object({
    id: z.string().regex(/^[QP]\d+$/),
    type: z.enum(["item", "property"]),
    label: z.string().min(1).max(200),
    description: z.string().max(1200),
    statements: z.array(statementSchema).min(1).max(20),
  }),
});

export async function POST(req: Request) {
  if (!aiAgentsEnabled({ ENABLE_AI_AGENTS: process.env.ENABLE_AI_AGENTS })) {
    await reportApiFailure({
      route: ROUTE_NAME,
      status: 404,
      category: API_FAILURE_CATEGORIES.AG2_DISABLED,
      message: AI_DISABLED_MESSAGE,
    });
    return Response.json({ error: AI_DISABLED_MESSAGE }, { status: 404 });
  }

  const limited = await aiRateLimitResponse(req);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    await reportApiFailure({
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
    await reportApiFailure({
      route: ROUTE_NAME,
      status: 400,
      category: API_FAILURE_CATEGORIES.REQUEST_VALIDATION,
      message: "Invalid entity summary request.",
    });
    return Response.json(
      { error: "Invalid entity summary request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { runAg2Agent } = await import("@/lib/ag2");
    const result = await runAg2Agent({ mode: "entity_summary", entity: parsed.data.entity });
    const grounding = validateAg2Grounding(result.summary, parsed.data.entity, {
      requiredIds: [parsed.data.entity.id],
    });
    if (!grounding.ok) {
      throw new Ag2BridgeError(AG2_GROUNDING_ERROR_MESSAGE, 502);
    }
    return Response.json({ summary: result.summary, grounding });
  } catch (error) {
    await reportApiFailure({
      route: ROUTE_NAME,
      status: error instanceof Ag2BridgeError ? error.status : 500,
      error,
    });
    if (error instanceof Ag2BridgeError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: "The AG2 entity summary service could not complete the response." },
      { status: 500 },
    );
  }
}
