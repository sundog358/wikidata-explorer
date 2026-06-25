import { AI_DISABLED_MESSAGE } from "./ai-feature-flags.mjs";

export const API_FAILURE_CATEGORIES = Object.freeze({
  AG2_DISABLED: "ag2-disabled",
  AG2_SERVICE_UNAVAILABLE: "ag2-service-unavailable",
  COMMONS_UNAVAILABLE: "commons-unavailable",
  OPENAI_KEY_MISSING: "openai-key-missing",
  OPENAI_QUOTA_OR_RATE_LIMIT: "openai-quota-rate-limit",
  REQUEST_RATE_LIMITED: "request-rate-limited",
  REQUEST_VALIDATION: "request-validation",
  SAFETY_POLICY: "safety-policy",
  UNKNOWN: "unknown",
  WIKIDATA_UNAVAILABLE: "wikidata-unavailable",
});

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{8,}/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  /(api[_-]?key|token|authorization)=([^&\s]+)/gi,
];

function cleanOneLine(value = "") {
  return String(value)
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeLogMessage(value, maxLength = 220) {
  let message = cleanOneLine(value);
  for (const pattern of SECRET_PATTERNS) {
    message = message.replace(pattern, (match, key) => (key ? `${key}=<redacted>` : "<redacted>"));
  }
  return message.length > maxLength ? `${message.slice(0, maxLength - 1)}…` : message;
}

function errorMessage(error) {
  if (typeof error === "string") return error;
  if (error && typeof error.message === "string") return error.message;
  return "";
}

export function classifyApiFailure(input = {}) {
  if (input.category && Object.values(API_FAILURE_CATEGORIES).includes(input.category)) {
    return input.category;
  }

  const status = Number(input.status || input.error?.status || 0);
  const message = cleanOneLine(input.message || errorMessage(input.error)).toLowerCase();

  if (message.includes(AI_DISABLED_MESSAGE.toLowerCase())) return API_FAILURE_CATEGORIES.AG2_DISABLED;
  if (/openai api key|api key is not configured|openai key/.test(message)) return API_FAILURE_CATEGORIES.OPENAI_KEY_MISSING;
  if (/quota|out of quota|openai.*rate limit|rate limited by openai/.test(message)) return API_FAILURE_CATEGORIES.OPENAI_QUOTA_OR_RATE_LIMIT;
  if (status === 429 && /agent|request|rate/.test(message)) return API_FAILURE_CATEGORIES.REQUEST_RATE_LIMITED;
  if (/wikidata/.test(message) || input.route === "wikidata") return API_FAILURE_CATEGORIES.WIKIDATA_UNAVAILABLE;
  if (/commons/.test(message) || input.route === "commons") return API_FAILURE_CATEGORIES.COMMONS_UNAVAILABLE;
  if (/autonomy safety|safety policy/.test(message) || status === 403) return API_FAILURE_CATEGORIES.SAFETY_POLICY;
  if (status === 400 || /invalid .*request|valid json|required/.test(message)) return API_FAILURE_CATEGORIES.REQUEST_VALIDATION;
  if (/ag2 service|ag2 workflow|ag2 chat|entity summary service|could not reach ag2|service unavailable|service url|service token/.test(message) || [502, 503, 504].includes(status)) {
    return API_FAILURE_CATEGORIES.AG2_SERVICE_UNAVAILABLE;
  }

  return API_FAILURE_CATEGORIES.UNKNOWN;
}

function safeRoute(route) {
  const value = cleanOneLine(route || "");
  if (/^\/api\/[a-z0-9-]+$/i.test(value)) return value;
  if (/^(wikidata|commons)$/i.test(value)) return value.toLowerCase();
  return "unknown";
}

export function apiFailureEvent(input = {}) {
  const status = Number(input.status || input.error?.status || 500);
  const message = sanitizeLogMessage(input.message || errorMessage(input.error) || "API route failed.");
  const errorName = typeof input.error?.name === "string" ? sanitizeLogMessage(input.error.name, 80) : undefined;

  return {
    event: "api_failure",
    route: safeRoute(input.route),
    category: classifyApiFailure({ ...input, status, message }),
    status,
    ...(errorName ? { errorName } : {}),
    message,
  };
}

export function logApiFailure(input = {}, logger = console) {
  const event = apiFailureEvent(input);
  const log = typeof logger.warn === "function" ? logger.warn.bind(logger) : console.warn.bind(console);
  log("[wikidata-explorer]", JSON.stringify(event));
  return event;
}
