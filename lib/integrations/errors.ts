export class IntegrationRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "IntegrationRequestError";
    this.status = status;
  }
}

export function getErrorStatus(error: unknown) {
  return error instanceof IntegrationRequestError ? error.status : 500;
}
