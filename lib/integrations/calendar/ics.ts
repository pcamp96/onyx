import { IntegrationRequestError } from "@/lib/integrations/errors";
import type { NormalizedCalendarEvent } from "@/lib/core/types";

type ParsedProperty = {
  name: string;
  params: Record<string, string>;
  value: string;
};

type ParsedEvent = {
  uid?: string;
  summary?: string;
  url?: string;
  organizer?: string;
  dtstart?: ParsedProperty;
  dtend?: ParsedProperty;
};

function unfoldIcsLines(input: string) {
  return input.replace(/\r?\n[ \t]/g, "");
}

function parseProperty(line: string): ParsedProperty | null {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex < 0) {
    return null;
  }

  const rawName = line.slice(0, separatorIndex);
  const value = line.slice(separatorIndex + 1).trim();
  const [name, ...paramEntries] = rawName.split(";");
  const params = Object.fromEntries(
    paramEntries.map((entry) => {
      const [key, ...rest] = entry.split("=");
      return [key.toUpperCase(), rest.join("=")];
    }),
  );

  return {
    name: name.toUpperCase(),
    params,
    value,
  };
}

function decodeText(value: string) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseDateOnly(value: string) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0));
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
) {
  let guess = Date.UTC(year, month - 1, day, hour, minute, second, 0);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const zoned = getTimeZoneParts(new Date(guess), timeZone);
    const desired = Date.UTC(year, month - 1, day, hour, minute, second, 0);
    const actual = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second, 0);
    const delta = desired - actual;

    if (delta === 0) {
      return new Date(guess);
    }

    guess += delta;
  }

  return new Date(guess);
}

function parseDateTime(value: string, timeZone?: string) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  if (value.endsWith("Z")) {
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), 0));
  }

  if (timeZone) {
    return zonedDateTimeToUtc(
      Number(year),
      Number(month),
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      timeZone,
    );
  }

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), 0));
}

function parseEventDate(property?: ParsedProperty) {
  if (!property) {
    return null;
  }

  const isDateOnly = property.params.VALUE?.toUpperCase() === "DATE";
  const parsed = isDateOnly ? parseDateOnly(property.value) : parseDateTime(property.value, property.params.TZID);
  if (!parsed) {
    return null;
  }

  return {
    date: parsed,
    allDay: isDateOnly,
  };
}

function parseEvents(input: string) {
  const lines = unfoldIcsLines(input).split(/\r?\n/);
  const events: ParsedEvent[] = [];
  let current: ParsedEvent | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (current) {
        events.push(current);
      }

      current = null;
      continue;
    }

    if (!current) {
      continue;
    }

    const property = parseProperty(line);
    if (!property) {
      continue;
    }

    switch (property.name) {
      case "UID": {
        current.uid = decodeText(property.value);
        break;
      }
      case "SUMMARY": {
        current.summary = decodeText(property.value);
        break;
      }
      case "URL": {
        current.url = decodeText(property.value);
        break;
      }
      case "ORGANIZER": {
        current.organizer = decodeText(property.value).replace(/^mailto:/i, "");
        break;
      }
      case "DTSTART": {
        current.dtstart = property;
        break;
      }
      case "DTEND": {
        current.dtend = property;
        break;
      }
      default:
        break;
    }
  }

  return events;
}

export function parseCalendarIcs(input: string): NormalizedCalendarEvent[] {
  const seenIds = new Set<string>();
  const events = parseEvents(input)
    .flatMap((event) => {
      const start = parseEventDate(event.dtstart);
      if (!start) {
        return [];
      }

      const end = parseEventDate(event.dtend);
      const id = event.uid || `${start.date.toISOString()}-${event.summary ?? "untitled"}`;
      if (seenIds.has(id)) {
        return [];
      }

      seenIds.add(id);
      return [
        {
          id,
          source: "calendar" as const,
          sourceId: id,
          title: event.summary || "Untitled event",
          start: start.date.toISOString(),
          end: (end?.date ?? start.date).toISOString(),
          allDay: start.allDay,
          isBusy: true,
          organizerEmail: event.organizer,
          sourceUrl: event.url,
          calendarName: "Calendar",
        },
      ];
    })
    .sort((left, right) => left.start.localeCompare(right.start));

  return events;
}

export async function fetchCalendarIcs(url: string) {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new IntegrationRequestError(error instanceof Error ? error.message : "Calendar request failed");
  }

  if (!response.ok) {
    throw new IntegrationRequestError(`Calendar request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}
