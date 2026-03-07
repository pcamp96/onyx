import { IntegrationRequestError } from "@/lib/integrations/errors";
import type { IntegrationAdapter, IntegrationSyncResult, SyncContext } from "@/lib/integrations/interfaces";
import { fetchCalendarIcs, parseCalendarIcs } from "@/lib/integrations/calendar/ics";

export class CalendarAdapter implements IntegrationAdapter {
  provider = "calendar" as const;
  capabilities = ["calendar"];

  async testConnection(context: SyncContext) {
    const result = await this.sync(context);
    return {
      ok: true,
      message: `Read ${result.calendarEvents.length} calendar events`,
      preview: result.calendarEvents.slice(0, 5),
    };
  }

  async sync(context: SyncContext): Promise<IntegrationSyncResult> {
    const config = (context.config ?? {}) as Record<string, unknown>;
    const urls = Array.isArray(config.icsUrls)
      ? config.icsUrls
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
      : typeof config.icsUrl === "string" && config.icsUrl.trim()
        ? [config.icsUrl.trim()]
        : [];

    if (!urls.length) {
      throw new IntegrationRequestError("Calendar needs at least one ICS URL");
    }

    try {
      urls.forEach((url) => {
        new URL(url);
      });
    } catch {
      throw new IntegrationRequestError("Calendar ICS URLs must be valid URLs");
    }

    const feeds = await Promise.all(urls.map((url) => fetchCalendarIcs(url)));
    const calendarEvents = feeds.flatMap((feed) => parseCalendarIcs(feed));

    return {
      tasks: [],
      calendarEvents,
      articleEntries: [],
      warnings: [],
      rawPreview: { count: calendarEvents.length, icsUrls: urls },
    };
  }
}
