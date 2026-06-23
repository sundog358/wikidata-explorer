export class Ag2BridgeError extends Error {
  status: number;
  constructor(message: string, status?: number);
}