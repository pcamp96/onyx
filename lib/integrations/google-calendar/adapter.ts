import { google } from "googleapis";

import { IntegrationRequestError } from "@/lib/integrations/errors";
import { parseGoogleServiceAccount, toGoogleIntegrationError } from "@/lib/integrations/google/utils";
import type { NormalizedCalendarEvent } from "@/lib/core/types";
import type { IntegrationAdapter, IntegrationSyncResult, SyncContext } from "@/lib/integrations/interfaces";

function buildAuth(secret?: string | null) {
  const credentials = parseGoogleServiceAccount(secret, "Google Calendar service account secret");
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
}

function mapEvent(event: Record<string, unknown>): NormalizedCalendarEvent {
  const start = (event.start as { dateTime?: string; date?: string } | undefined) ?? {};
  const end = (event.end as { dateTime?: string; date?: string } | undefined) ?? {};
  const organizer =
    typeof event.organizer === "object" && event.organizer ? (event.organizer as Record<string, unknown>) : null;
  const creator =
    typeof event.creator === "object" && event.creator ? (event.creator as Record<string, unknown>) : null;
  const attendees = Array.isArray(event.attendees)
    ? event.attendees.filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    : [];
  const selfAttendee = attendees.find((attendee) => attendee.self === true);

  return {
    id: String(event.id),
    source: "google-calendar",
    sourceId: String(event.id),
    title: String(event.summary ?? "Untitled event"),
    start: start.dateTime ?? `${start.date}T00:00:00.000Z`,
    end: end.dateTime ?? `${end.date}T00:00:00.000Z`,
    allDay: !start.dateTime,
    isBusy: event.transparency !== "transparent",
    calendarName:
      typeof organizer?.displayName === "string"
        ? organizer.displayName
        : typeof organizer?.email === "string"
          ? organizer.email
          : undefined,
    organizerEmail: typeof organizer?.email === "string" ? organizer.email : undefined,
    organizerName: typeof organizer?.displayName === "string" ? organizer.displayName : undefined,
    creatorEmail: typeof creator?.email === "string" ? creator.email : undefined,
    selfAttendee: Boolean(selfAttendee || organizer?.self === true || creator?.self === true),
    responseStatus: typeof selfAttendee?.responseStatus === "string" ? selfAttendee.responseStatus : undefined,
    sourceUrl: typeof event.htmlLink === "string" ? event.htmlLink : undefined,
  };
}

export class GoogleCalendarAdapter implements IntegrationAdapter {
  provider = "google-calendar" as const;
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
    const calendarIds = Array.isArray(config.calendarIds)
      ? config.calendarIds
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
      : typeof config.calendarId === "string" && config.calendarId.trim()
        ? [config.calendarId.trim()]
        : [];

    if (!calendarIds.length) {
      throw new IntegrationRequestError("Google Calendar needs at least one calendar ID");
    }

    try {
      const auth = buildAuth(context.secret);
      const client = google.calendar({ version: "v3", auth });
      const responses = await Promise.all(
        calendarIds.map((calendarId) =>
          client.events.list({
            calendarId,
            singleEvents: true,
            orderBy: "startTime",
            timeMin: context.now.toISOString(),
            maxResults: 50,
          }),
        ),
      );
      const seenIds = new Set<string>();
      const calendarEvents = responses.flatMap((response) =>
        (response.data.items ?? []).flatMap((item) => {
          const mapped = mapEvent(item as unknown as Record<string, unknown>);
          if (seenIds.has(mapped.id)) {
            return [];
          }

          seenIds.add(mapped.id);
          return [mapped];
        }),
      );

      return {
        tasks: [],
        calendarEvents,
        articleEntries: [],
        warnings: [],
        rawPreview: { count: calendarEvents.length, calendarIds },
      };
    } catch (error) {
      throw toGoogleIntegrationError(error, "Google Calendar request failed");
    }
  }
}
