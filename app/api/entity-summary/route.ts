import { z } from "zod";
import { aiAgentsEnabled, AI_DISABLED_MESSAGE } from "@/lib/ai-feature-flags.mjs";
import { aiRateLimitKey, AI_RATE_LIMIT_MESSAGE, checkAiRateLimit } from "@/lib/ai-rate-limit.mjs";
import { Ag2BridgeError } from "@/lib/ag2-errors.mjs";

export const runtime = "nodejs";
export const maxDuration = 60;

function aiRateLimitResponse(req: Request) {
  const limit = checkAiRateLimit({
    key: aiRateLimitKey(req.headers),
    env: process.env,
  });

  if (limit.allowed) return null;

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
    return Response.json({ error: AI_DISABLED_MESSAGE }, { status: 404 });
  }

  const limited = aiRateLimitResponse(req);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid entity summary request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { runAg2Agent } = await import("@/lib/ag2");
    const result = await runAg2Agent({ mode: "entity_summary", entity: parsed.data.entity });
    return Response.json({ summary: result.summary });
  } catch (error) {
    console.error("AG2 entity summary route failed:", error);
    if (error instanceof Ag2BridgeError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: "The AG2 entity summary service could not complete the response." },
      { status: 500 },
    );
  }
}
