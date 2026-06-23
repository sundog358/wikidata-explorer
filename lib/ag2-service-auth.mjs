export const AG2_SERVICE_TOKEN_MIN_LENGTH = 32;

export const AG2_SERVICE_TOKEN_MISSING_MESSAGE =
  "AG2 service token is required when AG2_SERVICE_URL is configured.";

export const AG2_SERVICE_TOKEN_WEAK_MESSAGE =
  `AG2 service token must be at least ${AG2_SERVICE_TOKEN_MIN_LENGTH} characters.`;

export function validateAg2ServiceToken(env = {}) {
  const token = String(env.AG2_SERVICE_TOKEN || "").trim();
  if (!token) {
    return { ok: false, status: 503, error: AG2_SERVICE_TOKEN_MISSING_MESSAGE };
  }
  if (token.length < AG2_SERVICE_TOKEN_MIN_LENGTH) {
    return { ok: false, status: 503, error: AG2_SERVICE_TOKEN_WEAK_MESSAGE };
  }

  return { ok: true, token };
}

export function ag2ServiceAuthorizationHeader(env = {}) {
  const result = validateAg2ServiceToken(env);
  if (!result.ok) return result;
  return { ok: true, header: `Bearer ${result.token}` };
}
