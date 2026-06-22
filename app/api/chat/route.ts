import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

function readLocalEnvValue(name: string) {
  if (process.env.NODE_ENV === "production") return undefined;

  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return undefined;

  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.match(new RegExp(`^\\s*${name}\\s*=`)));

  if (!line) return undefined;

  const value = line.replace(new RegExp(`^\\s*${name}\\s*=\\s*`), "").trim();
  if (!value) return undefined;

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function getOpenAIKey() {
  return readLocalEnvValue("OPENAI_API_KEY") || process.env.OPENAI_API_KEY;
}

function toSafeChatError(error: unknown) {
  console.error("Chat stream failed:", error);

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("api key") ||
      message.includes("401") ||
      message.includes("unauthorized")
    ) {
      return "The OpenAI API key was rejected by the provider.";
    }
    if (message.includes("model") || message.includes("404")) {
      return "The configured OpenAI model is unavailable for this key.";
    }
    if (
      message.includes("rate") ||
      message.includes("quota") ||
      message.includes("429")
    ) {
      return "The OpenAI API is rate limited or out of quota.";
    }
  }

  return "The chat service could not complete the response.";
}

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().trim().min(1).max(8000),
});

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["system", "user", "assistant"]),
  parts: z.array(textPartSchema).min(1).max(20),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(30),
});

export async function POST(req: Request) {
  const apiKey = getOpenAIKey();

  if (!apiKey) {
    return Response.json(
      { error: "OpenAI API key is not configured for this server." },
      { status: 503 },
    );
  }

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

  try {
    const openai = createOpenAI({ apiKey });
    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
      system:
        "You are a concise assistant inside Wikidata Explorer. Help users reason about Wikidata, linked data, and the current conversation without fabricating facts.",
      messages: await convertToModelMessages(parsed.data.messages as UIMessage[]),
      temperature: 0.4,
      maxOutputTokens: 700,
    });

    return result.toUIMessageStreamResponse({
      onError: toSafeChatError,
    });
  } catch (error) {
    console.error("Chat route failed:", error);
    return Response.json(
      { error: "The chat service could not start a response." },
      { status: 500 },
    );
  }
}