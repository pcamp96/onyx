import type { NormalizedCalendarEvent, PlannerSettings } from "@/lib/core/types";

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function matchesIdentifier(event: NormalizedCalendarEvent, identifiers: string[]) {
  if (!identifiers.length) {
    return false;
  }

  const haystacks = [
    event.organizerEmail,
    event.organizerName,
    event.creatorEmail,
    event.calendarName,
    event.title,
  ]
    .map(normalize)
    .filter(Boolean);

  return identifiers.some((identifier) => haystacks.some((entry) => entry.includes(identifier)));
}

function isOwnedAppointment(event: NormalizedCalendarEvent, settings: PlannerSettings) {
  const identifiers = settings.calendarOwnerIdentifiers.map(normalize).filter(Boolean);
  return Boolean(event.selfAttendee) || matchesIdentifier(event, identifiers);
}

export function getBlockingCalendarEvents(events: NormalizedCalendarEvent[], settings: PlannerSettings) {
  return events.filter((event) => {
    if (!event.isBusy || event.responseStatus === "declined") {
      return false;
    }

    if (settings.calendarEventHandling === "all_busy") {
      return true;
    }

    return isOwnedAppointment(event, settings);
  });
}
