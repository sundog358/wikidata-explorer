import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function POST(req: Request) {
  // Parse the incoming request to extract messages
  const { messages } = await req.json();

  // Use the `streamText` function to stream the AI response
  const result = streamText({
    model: openai("gpt-3.5-turbo"),
    messages: messages.map((message: any) => ({
      role: message.role,
      content: message.content,
    })),
  });

  // Return the response as a streaming data response
  return result.toDataStreamResponse();
}
