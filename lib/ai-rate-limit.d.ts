export const AI_RATE_LIMIT_MESSAGE: string;

export type AiRateLimitOptions = {
  windowMs: number;
  maxRequests: number;
};

export type AiRateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
};

export function aiRateLimitOptions(env?: Record<string, string | undefined>): AiRateLimitOptions;
export function aiRateLimitKey(headers: Headers): string;
export function checkAiRateLimit(args: {
  key: string;
  now?: number;
  env?: Record<string, string | undefined>;
}): AiRateLimitResult;
export function resetAiRateLimitBuckets(): void;
