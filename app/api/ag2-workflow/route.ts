import { z } from "zod";
import { Ag2BridgeError, runAg2Agent } from "@/lib/ag2";
import { evaluateAutonomyAction } from "@/lib/autonomy-safety.mjs";

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
    return Response.json(
      { error: "Autonomy safety policy blocked this workflow.", safety },
      { status: 403 },
    );
  }

  if (action !== "research" && !entity) {
    return Response.json(
      { error: "This AG2 workflow requires visible entity context." },
      { status: 400 },
    );
  }
  if (action === "compare" && !compareEntityId) {
    return Response.json(
      { error: "Comparison requires a second Wikidata entity ID." },
      { status: 400 },
    );
  }

  try {
    const result = await runAg2Agent({
      mode: "workflow",
      action,
      entity,
      entityId: entityId || entity?.id,
      compareEntityId,
      graphFocus,
    });
    return Response.json({ result: result.result, safety });
  } catch (error) {
    console.error("AG2 workflow route failed:", error);
    if (error instanceof Ag2BridgeError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: "The AG2 workflow service could not complete the response." },
      { status: 500 },
    );
  }
}


