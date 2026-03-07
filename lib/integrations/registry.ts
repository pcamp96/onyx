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
    case "google-calendar": {
      const imported = await import("@/lib/integrations/google-calendar/adapter");
      return new imported.GoogleCalendarAdapter();
    }
    case "apple-calendar": {
      const imported = await import("@/lib/integrations/apple-calendar/adapter");
      return new imported.AppleCalendarAdapter();
    }
    default:
      throw new Error(`Unknown integration provider: ${provider}`);
  }
}
