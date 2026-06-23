const NON_RETRYABLE_PATTERNS = [
  /api key/i,
  /unauthorized/i,
  /authentication/i,
  /model.*unavailable/i,
  /invalid/i,
  /missing/i,
  /requires/i,
  /unsupported/i,
  /out of quota/i,
];

const RETRYABLE_PATTERNS = [
  /rate limited/i,
  /timeout|timed out/i,
  /temporarily/i,
  /service unavailable/i,
  /connection/i,
  /unreadable response/i,
];

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

function cleanNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeAg2RetryOptions(options = {}) {
  return {
    maxAttempts: Math.min(3, Math.max(1, Math.floor(cleanNumber(options.maxAttempts, 2)))),
    baseDelayMs: Math.min(5000, Math.max(100, Math.floor(cleanNumber(options.baseDelayMs, 800)))),
    maxDelayMs: Math.min(10000, Math.max(100, Math.floor(cleanNumber(options.maxDelayMs, 2500)))),
  };
}

export function ag2RetryDelayMs(attempt, options = {}) {
  const normalized = normalizeAg2RetryOptions(options);
  const exponent = Math.max(0, Math.floor(attempt) - 1);
  return Math.min(normalized.maxDelayMs, normalized.baseDelayMs * 2 ** exponent);
}

export function shouldRetryAg2Error(error, attempt, options = {}) {
  const normalized = normalizeAg2RetryOptions(options);
  if (attempt >= normalized.maxAttempts) return false;

  const status = Number(error?.status || 0);
  const message = String(error?.message || "");

  if (NON_RETRYABLE_PATTERNS.some((pattern) => pattern.test(message))) return false;
  if (RETRYABLE_STATUSES.has(status)) return true;
  return RETRYABLE_PATTERNS.some((pattern) => pattern.test(message));
}
