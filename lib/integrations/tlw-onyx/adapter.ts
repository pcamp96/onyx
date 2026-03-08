import type { IntegrationAdapter } from "@/lib/integrations/interfaces";
import { createTlwOnyxClient } from "@/lib/integrations/tlw-onyx/client";

function readBaseUrl(config?: Record<string, unknown> | null) {
  const baseUrl = config?.baseUrl;
  return typeof baseUrl === "string" ? baseUrl : undefined;
}

export class TlwOnyxAdapter implements IntegrationAdapter {
  provider = "tlw-onyx" as const;
  capabilities = ["metrics", "analytics", "overview"];

  async testConnection(context: Parameters<IntegrationAdapter["testConnection"]>[0]) {
    const client = createTlwOnyxClient({
      baseUrl: readBaseUrl(context.config),
      secret: context.secret,
    });
    const overview = await client.getOverview();

    return {
      ok: true,
      message: "TLW Onyx API connected",
      preview: {
        generated_at: overview.generated_at,
        users_total: overview.snapshot.users_total,
        settings_total: overview.snapshot.settings_total,
        top_channel: overview.analytics.top_channel ?? "unknown",
      },
    };
  }

  async sync(context: Parameters<IntegrationAdapter["sync"]>[0]) {
    const client = createTlwOnyxClient({
      baseUrl: readBaseUrl(context.config),
      secret: context.secret,
    });
    const overview = await client.getOverview();

    return {
      tasks: [],
      calendarEvents: [],
      articleEntries: [],
      warnings: [],
      rawPreview: {
        overview,
      },
    };
  }
}
