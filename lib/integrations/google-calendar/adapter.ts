import { google } from "googleapis";

import type { NormalizedCalendarEvent } from "@/lib/core/types";
import type { IntegrationAdapter, IntegrationSyncResult, SyncContext } from "@/lib/integrations/interfaces";

function buildAuth(secret?: string | null) {
  if (!secret) {
    throw new Error("Google Calendar requires a service account secret");
  }

  const credentials = JSON.parse(secret) as { client_email: string; private_key: string };
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
}

function mapEvent(event: Record<string, unknown>): NormalizedCalendarEvent {
  const start = (event.start as { dateTime?: string; date?: string } | undefined) ?? {};
  const end = (event.end as { dateTime?: string; date?: string } | undefined) ?? {};

  return {
    id: String(event.id),
    source: "google-calendar",
    sourceId: String(event.id),
    title: String(event.summary ?? "Untitled event"),
    start: start.dateTime ?? `${start.date}T00:00:00.000Z`,
    end: end.dateTime ?? `${end.date}T00:00:00.000Z`,
    allDay: !start.dateTime,
    isBusy: true,
    calendarName: typeof event.organizer === "string" ? event.organizer : undefined,
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
    const calendarId =
      context.config && typeof (context.config as Record<string, unknown>).calendarId === "string"
        ? ((context.config as Record<string, unknown>).calendarId as string)
        : null;
    if (!calendarId) {
      throw new Error("Google Calendar calendarId is missing");
    }

    const auth = buildAuth(context.secret);
    const client = google.calendar({ version: "v3", auth });
    const response = await client.events.list({
      calendarId,
      singleEvents: true,
      orderBy: "startTime",
      timeMin: context.now.toISOString(),
      maxResults: 50,
    });

    const calendarEvents = (response.data.items ?? []).map((item) =>
      mapEvent(item as unknown as Record<string, unknown>),
    );

    return {
      tasks: [],
      calendarEvents,
      articleEntries: [],
      warnings: [],
      rawPreview: { count: calendarEvents.length },
    };
  }
}
