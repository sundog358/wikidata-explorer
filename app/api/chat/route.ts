import { z } from "zod";
import { Ag2BridgeError, runAg2Agent } from "@/lib/ag2";

export const runtime = "nodejs";
export const maxDuration = 60;

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
      { error: "Invalid chat request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const messages = parsed.data.messages.map((message) => ({
    role: message.role,
    content: messageContent(message),
  }));

  try {
    const result = await runAg2Agent({ mode: "chat", messages });
    return Response.json({ message: result.message });
  } catch (error) {
    console.error("AG2 chat route failed:", error);
    if (error instanceof Ag2BridgeError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: "The AG2 chat service could not complete the response." },
      { status: 500 },
    );
  }
}
