import * as ical from "node-ical";

import type { NormalizedCalendarEvent } from "@/lib/core/types";
import type { IntegrationAdapter, IntegrationSyncResult, SyncContext } from "@/lib/integrations/interfaces";

function toEvent(event: ical.VEvent): NormalizedCalendarEvent {
  const rawUrl = event.url as unknown;
  let sourceUrl: string | undefined;

  if (typeof rawUrl === "string") {
    sourceUrl = rawUrl;
  } else if (
    rawUrl &&
    typeof rawUrl === "object" &&
    "val" in rawUrl &&
    typeof (rawUrl as { val?: unknown }).val === "string"
  ) {
    sourceUrl = (rawUrl as { val: string }).val;
  }

  const rawSummary = event.summary as unknown;
  const title = typeof rawSummary === "string" ? rawSummary : "Untitled event";

  return {
    id: event.uid || `${event.start.toISOString()}-${event.summary}`,
    provider: "apple-calendar",
    title,
    start: event.start.toISOString(),
    end: (event.end ?? event.start).toISOString(),
    allDay: Boolean(event.datetype === "date"),
    sourceUrl,
  };
}

export class AppleCalendarAdapter implements IntegrationAdapter {
  provider = "apple-calendar" as const;
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
    const url =
      context.config && typeof (context.config as Record<string, unknown>).icsUrl === "string"
        ? ((context.config as Record<string, unknown>).icsUrl as string)
        : null;
    if (!url) {
      throw new Error("Apple Calendar ICS URL is missing");
    }

    const parsed = await ical.async.fromURL(url);
    const calendarEvents = Object.values(parsed)
      .filter((entry): entry is ical.VEvent => Boolean(entry) && (entry as ical.VEvent).type === "VEVENT")
      .map(toEvent)
      .sort((left, right) => left.start.localeCompare(right.start));

    return {
      tasks: [],
      calendarEvents,
      articleEntries: [],
      warnings: [],
      rawPreview: { count: calendarEvents.length },
    };
  }
}
