import { describe, expect, it } from "vitest";

import { parseCalendarIcs } from "@/lib/integrations/calendar/ics";

describe("calendar ics parser", () => {
  it("parses timed events with timezone identifiers", () => {
    const events = parseCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-1
SUMMARY:Writer call
DTSTART;TZID=America/Chicago:20260307T090000
DTEND;TZID=America/Chicago:20260307T100000
URL:https://example.com/event
ORGANIZER:mailto:patrick@example.com
END:VEVENT
END:VCALENDAR`);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "event-1",
      title: "Writer call",
      organizerEmail: "patrick@example.com",
      sourceUrl: "https://example.com/event",
      allDay: false,
    });
    expect(events[0]?.start.startsWith("2026-03-07T15:00:00")).toBe(true);
  });

  it("parses all day events", () => {
    const events = parseCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-2
SUMMARY:Offsite
DTSTART;VALUE=DATE:20260309
DTEND;VALUE=DATE:20260310
END:VEVENT
END:VCALENDAR`);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "event-2",
      title: "Offsite",
      allDay: true,
      start: "2026-03-09T00:00:00.000Z",
      end: "2026-03-10T00:00:00.000Z",
    });
  });
});
