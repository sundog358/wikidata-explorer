import { ag2ServiceAuthorizationHeader } from "./ag2-service-auth.mjs";
import { Ag2BridgeError } from "./ag2-errors.mjs";

export function ag2ServiceUrl(env = process.env) {
  const rawUrl = String(env.AG2_SERVICE_URL || "").trim();
  if (!rawUrl) return null;
  return rawUrl.replace(/\/+$/, "");
}

export async function runRemoteAg2Agent(payload, options = {}) {
  const {
    env = process.env,
    fetchImpl = globalThis.fetch,
    timeoutMs = 45000,
  } = options;

  const baseUrl = ag2ServiceUrl(env);
  if (!baseUrl) throw new Ag2BridgeError("AG2 service URL is not configured.", 500);

  const authorization = ag2ServiceAuthorizationHeader(env);
  if (!("header" in authorization)) {
    const message = "error" in authorization && authorization.error ? authorization.error : "AG2 service token is invalid.";
    const status = "status" in authorization && authorization.status ? authorization.status : 503;
    throw new Ag2BridgeError(message, status);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(new URL("run", baseUrl + "/").toString(), {
      method: "POST",
      headers: {
        authorization: authorization.header,
        "content-type": "application/json",
      },
      body: JSON.stringify({ payload }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({ error: "AG2 service returned an unreadable response." }));

    if (!response.ok || data.ok === false) {
      throw new Ag2BridgeError(data.error || data.detail || "AG2 service failed.", data.status || response.status || 502);
    }

    return data;
  } catch (error) {
    if (error instanceof Ag2BridgeError) throw error;
    const message = error instanceof Error ? error.message : "AG2 service request failed.";
    throw new Ag2BridgeError("Could not reach AG2 service: " + message, 502);
  } finally {
    clearTimeout(timer);
  }
}