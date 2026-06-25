import { z } from "zod";
import { aiAgentsEnabled, AI_DISABLED_MESSAGE } from "@/lib/ai-feature-flags.mjs";
import { aiRateLimitKey, AI_RATE_LIMIT_MESSAGE, checkAiRateLimit } from "@/lib/ai-rate-limit.mjs";
import { Ag2BridgeError } from "@/lib/ag2-errors.mjs";
import { AG2_GROUNDING_ERROR_MESSAGE, validateAg2Grounding } from "@/lib/ag2-grounding-validation.mjs";
import { sanitizeChatVisibleContext } from "@/lib/ag2-chat-context.mjs";
import { API_FAILURE_CATEGORIES, logApiFailure } from "@/lib/api-observability.mjs";

export const runtime = "nodejs";
export const maxDuration = 60;
const ROUTE_NAME = "/api/chat";

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

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().trim().min(1).max(8000),
});

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().trim().min(1).max(8000).optional(),
  parts: z.array(textPartSchema).min(1).max(20).optional(),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(30),
  context: z.unknown().optional(),
});

function messageContent(message: z.infer<typeof messageSchema>) {
  if (message.content) return message.content;
  return (message.parts || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

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
      message: "Invalid chat request.",
    });
    return Response.json(
      { error: "Invalid chat request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const messages = parsed.data.messages.map((message) => ({
    role: message.role,
    content: messageContent(message),
  }));
  const context = parsed.data.context === undefined ? null : sanitizeChatVisibleContext(parsed.data.context);
  if (parsed.data.context !== undefined && !context) {
    logApiFailure({
      route: ROUTE_NAME,
      status: 400,
      category: API_FAILURE_CATEGORIES.REQUEST_VALIDATION,
      message: "Invalid chat context.",
    });
    return Response.json(
      { error: "Invalid chat context." },
      { status: 400 },
    );
  }

  try {
    const { runAg2Agent } = await import("@/lib/ag2");
    const result = await runAg2Agent({ mode: "chat", messages, context: context || undefined });
    const grounding = validateAg2Grounding(result.message, { messages, context }, {
      requiredIds: context?.entity?.id ? [context.entity.id] : [],
    });
    if (!grounding.ok) {
      throw new Ag2BridgeError(AG2_GROUNDING_ERROR_MESSAGE, 502);
    }
    return Response.json({ message: result.message, grounding });
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
      { error: "The AG2 chat service could not complete the response." },
      { status: 500 },
    );
  }
}
