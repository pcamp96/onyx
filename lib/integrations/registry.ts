import type { IntegrationProvider } from "@/lib/core/types";
import type { IntegrationAdapter } from "@/lib/integrations/interfaces";

export async function getIntegrationAdapter(provider: IntegrationProvider): Promise<IntegrationAdapter> {
  switch (provider) {
    case "asana": {
      const imported = await import("@/lib/integrations/asana/adapter");
      return new imported.AsanaAdapter();
    }
    case "todoist": {
      const imported = await import("@/lib/integrations/todoist/adapter");
      return new imported.TodoistAdapter();
    }
    case "google-sheets": {
      const imported = await import("@/lib/integrations/google-sheets/adapter");
      return new imported.GoogleSheetsAdapter();
    }
    case "calendar": {
      const imported = await import("@/lib/integrations/calendar/adapter");
      return new imported.CalendarAdapter();
    }
    case "tlw-onyx": {
      const imported = await import("@/lib/integrations/tlw-onyx/adapter");
      return new imported.TlwOnyxAdapter();
    }
    default:
      throw new Error(`Unknown integration provider: ${provider}`);
  }
}
