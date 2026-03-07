import { IntegrationRequestError } from "@/lib/integrations/errors";

type GoogleCredentials = {
  client_email: string;
  private_key: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function parseGoogleServiceAccount(secret?: string | null, label = "Google service account secret"): GoogleCredentials {
  if (!secret) {
    throw new IntegrationRequestError(`${label} is missing`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(secret);
  } catch {
    throw new IntegrationRequestError(`${label} must be valid JSON`);
  }

  if (
    !isRecord(parsed) ||
    typeof parsed.client_email !== "string" ||
    typeof parsed.private_key !== "string" ||
    !parsed.client_email.trim() ||
    !parsed.private_key.trim()
  ) {
    throw new IntegrationRequestError(`${label} must include client_email and private_key`);
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
  };
}

export function toGoogleIntegrationError(error: unknown, fallbackMessage: string) {
  if (error instanceof IntegrationRequestError) {
    return error;
  }

  const candidate = error as {
    message?: unknown;
    code?: unknown;
    response?: {
      status?: unknown;
      data?: {
        error?: {
          message?: unknown;
        };
      };
    };
  };

  const status = typeof candidate?.response?.status === "number" ? candidate.response.status : undefined;
  const upstreamMessage =
    typeof candidate?.response?.data?.error?.message === "string"
      ? candidate.response.data.error.message
      : typeof candidate?.message === "string"
        ? candidate.message
        : fallbackMessage;

  if (status && status >= 400 && status < 500) {
    return new IntegrationRequestError(upstreamMessage, status);
  }

  return error;
}
