const buckets = new Map();

export const AI_RATE_LIMIT_MESSAGE = "Too many AI requests. Try again shortly.";

export function aiRateLimitOptions(env = {}) {
  const windowMs = Number.parseInt(String(env.AI_AGENT_RATE_LIMIT_WINDOW_MS || ""), 10);
  const maxRequests = Number.parseInt(String(env.AI_AGENT_RATE_LIMIT_MAX || ""), 10);

  return {
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000,
    maxRequests: Number.isFinite(maxRequests) && maxRequests > 0 ? maxRequests : 20,
  };
}

export function aiRateLimitKey(headers) {
  const forwardedFor = headers.get("x-forwarded-for") || "";
  const firstForwardedIp = forwardedFor.split(",")[0]?.trim();
  return firstForwardedIp || headers.get("x-real-ip") || "local";
}

export function checkAiRateLimit({ key, now = Date.now(), env = {} }) {
  const { windowMs, maxRequests } = aiRateLimitOptions(env);
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs, retryAfterMs: 0 };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterMs: Math.max(0, current.resetAt - now),
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetAt: current.resetAt,
    retryAfterMs: 0,
  };
}

export function resetAiRateLimitBuckets() {
  buckets.clear();
}
