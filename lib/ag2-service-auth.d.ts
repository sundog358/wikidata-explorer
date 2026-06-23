export const AG2_SERVICE_TOKEN_MIN_LENGTH: number;
export const AG2_SERVICE_TOKEN_MISSING_MESSAGE: string;
export const AG2_SERVICE_TOKEN_WEAK_MESSAGE: string;

export type Ag2ServiceTokenValidation =
  | { ok: true; token: string }
  | { ok: false; status: number; error: string };

export type Ag2ServiceAuthorizationHeader =
  | { ok: true; header: string }
  | { ok: false; status: number; error: string };

export function validateAg2ServiceToken(env?: Record<string, string | undefined>): Ag2ServiceTokenValidation;
export function ag2ServiceAuthorizationHeader(env?: Record<string, string | undefined>): Ag2ServiceAuthorizationHeader;
