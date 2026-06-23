export class Ag2BridgeError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "Ag2BridgeError";
    this.status = status;
  }
}