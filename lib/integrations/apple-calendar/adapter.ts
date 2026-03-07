import * as ical from "node-ical";

import { IntegrationRequestError } from "@/lib/integrations/errors";
import type { NormalizedCalendarEvent } from "@/lib/core/types";
import type { IntegrationAdapter, IntegrationSyncResult, SyncContext } from "@/lib/integrations/interfaces";

function readMailto(value: unknown) {
  if (typeof value === "string") {
    return value.replace(/^mailto:/i, "");
  }

  if (value && typeof value === "object" && "val" in value && typeof (value as { val?: unknown }).val === "string") {
    return (value as { val: string }).val.replace(/^mailto:/i, "");
  }

  return undefined;
}

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
    source: "apple-calendar",
    sourceId: event.uid || `${event.start.toISOString()}-${event.summary}`,
    title,
    start: event.start.toISOString(),
    end: (event.end ?? event.start).toISOString(),
    allDay: Boolean(event.datetype === "date"),
    isBusy: true,
    calendarName: "Apple Calendar",
    organizerEmail: readMailto((event as unknown as { organizer?: unknown }).organizer),
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
      throw new IntegrationRequestError("Apple Calendar needs at least one ICS URL");
    }

    try {
      urls.forEach((url) => {
        new URL(url);
      });
    } catch {
      throw new IntegrationRequestError("Apple Calendar ICS URLs must be valid URLs");
    }

    const feeds = await Promise.all(
      urls.map(async (url) => {
        try {
          return await ical.async.fromURL(url);
        } catch (error) {
          throw new IntegrationRequestError(error instanceof Error ? error.message : "Apple Calendar request failed");
        }
      }),
    );

    const seenIds = new Set<string>();
    const calendarEvents = feeds
      .flatMap((parsed) =>
        Object.values(parsed)
          .filter((entry): entry is ical.VEvent => Boolean(entry) && (entry as ical.VEvent).type === "VEVENT")
          .map(toEvent)
          .filter((event) => {
            if (seenIds.has(event.id)) {
              return false;
            }

            seenIds.add(event.id);
            return true;
          }),
      )
      .sort((left, right) => left.start.localeCompare(right.start));

    return {
      tasks: [],
      calendarEvents,
      articleEntries: [],
      warnings: [],
      rawPreview: { count: calendarEvents.length, icsUrls: urls },
    };
  }
}
