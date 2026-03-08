import type { TlwAnalyticsResponse, TlwOverviewResponse, TlwSnapshotResponse } from "@/lib/core/types";
import { IntegrationRequestError } from "@/lib/integrations/errors";

export const DEFAULT_TLW_ONYX_BASE_URL = "https://thelaserworkshop.com";

function normalizeBaseUrl(baseUrl?: string | null) {
  if (!baseUrl) {
    return DEFAULT_TLW_ONYX_BASE_URL;
  }

  try {
    return new URL(baseUrl).toString().replace(/\/$/, "");
  } catch {
    throw new IntegrationRequestError("TLW Onyx base URL must be a valid URL", 400);
  }
}

function normalizeToken(secret?: string | null) {
  const token = secret?.trim() ?? "";
  if (!token) {
    throw new IntegrationRequestError("TLW Onyx token is missing", 400);
  }

  return token;
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || response.statusText || "TLW Onyx request failed";
  } catch {
    return response.statusText || "TLW Onyx request failed";
  }
}

export class TlwOnyxClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  async getSnapshot() {
    return this.request<TlwSnapshotResponse>("/api/onyx/snapshot");
  }

  async getAnalytics(windowDays = 7) {
    const params = new URLSearchParams({ window_days: String(windowDays) });
    return this.request<TlwAnalyticsResponse>(`/api/onyx/analytics?${params.toString()}`);
  }

  async getOverview(windowDays = 7) {
    const params = new URLSearchParams({ window_days: String(windowDays) });
    return this.request<TlwOverviewResponse>(`/api/onyx/overview?${params.toString()}`);
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Accept: "application/json",
        "x-onyx-token": this.token,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new IntegrationRequestError(await parseError(response), response.status);
    }

    return (await response.json()) as T;
  }
}

export function createTlwOnyxClient(input: { baseUrl?: string | null; secret?: string | null }) {
  return new TlwOnyxClient(normalizeBaseUrl(input.baseUrl), normalizeToken(input.secret));
}
