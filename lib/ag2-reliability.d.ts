export type Ag2RetryOptions = {
  maxAttempts?: number | string;
  baseDelayMs?: number | string;
  maxDelayMs?: number | string;
};

export function normalizeAg2RetryOptions(options?: Ag2RetryOptions): Required<Ag2RetryOptions>;
export function ag2RetryDelayMs(attempt: number, options?: Ag2RetryOptions): number;
export function shouldRetryAg2Error(error: { status?: number; message?: string }, attempt: number, options?: Ag2RetryOptions): boolean;
