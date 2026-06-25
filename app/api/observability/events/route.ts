import {
  apiObservabilityReceiverSnapshot,
  authorizeApiObservabilityReceiver,
  receiveApiObservabilityMonitorPayload,
} from "@/lib/api-observability.mjs";

export const runtime = "nodejs";

function authResponse(req: Request) {
  const auth = authorizeApiObservabilityReceiver(req.headers, process.env);
  if (auth.authorized) return null;

  return Response.json(
    { error: "Observability receiver is unavailable.", reason: auth.reason },
    { status: auth.status },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function POST(req: Request) {
  const unauthorized = authResponse(req);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return Response.json(
      { error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const received = receiveApiObservabilityMonitorPayload(body);
  return Response.json({
    received: received.received,
    category: received.event.category,
    retainedEvents: received.retainedEvents,
    firingAlerts: received.alertResults.filter((alert: { firing: boolean }) => alert.firing),
  }, { status: 202 });
}

export async function GET(req: Request) {
  const unauthorized = authResponse(req);
  if (unauthorized) return unauthorized;

  return Response.json(apiObservabilityReceiverSnapshot());
}
