import { z } from "zod";
import { Ag2BridgeError, runAg2Agent } from "@/lib/ag2";

export const runtime = "nodejs";
export const maxDuration = 60;

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
