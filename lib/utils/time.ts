const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MS = 1000 * 60 * 60 * 24;
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const WEEKDAY_INDEX = new Map<number, number>(WEEKDAY_ORDER.map((day, index) => [day, index]));
const WEEKDAY_LABELS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function getDateTimeParts(value: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAY_LABELS[parts.weekday] ?? 0,
  };
}

function dateKeyToDayNumber(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS);
}

function dayNumberToDateKey(dayNumber: number) {
  const date = new Date(dayNumber * DAY_IN_MS);
  return formatDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function shiftDateKey(dateKey: string, days: number) {
  return dayNumberToDateKey(dateKeyToDayNumber(dateKey) + days);
}

function middayUtcForDateOnly(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

function formatNumber(value: number) {
  return Number(value.toFixed(2));
}

export function isDateOnlyValue(dateValue?: string) {
  return Boolean(dateValue && DATE_ONLY_PATTERN.test(dateValue));
}

export function toIsoDate(value: Date, timeZone?: string) {
  if (!timeZone) {
    return value.toISOString().slice(0, 10);
  }

  const parts = getDateTimeParts(value, timeZone);
  return formatDateKey(parts.year, parts.month, parts.day);
}

export function toMonthKey(value: Date, timeZone?: string) {
  return toIsoDate(value, timeZone).slice(0, 7);
}

export function toWeekKey(value: Date, timeZone?: string) {
  return toIsoDate(startOfWeek(value, timeZone));
}

export function localWeekday(value: Date, timeZone: string) {
  return getDateTimeParts(value, timeZone).weekday;
}

export function startOfWeek(value: Date, timeZone?: string) {
  const dateKey = toIsoDate(value, timeZone);
  const weekday = timeZone ? localWeekday(value, timeZone) : value.getDay();
  const diff = WEEKDAY_INDEX.get(weekday) ?? 0;
  const weekStartKey = shiftDateKey(dateKey, -diff);

  return new Date(`${weekStartKey}T00:00:00.000Z`);
}

export function endOfWeek(value: Date, timeZone?: string) {
  const weekStart = startOfWeek(value, timeZone);
  return new Date(weekStart.getTime() + DAY_IN_MS * 6 + (DAY_IN_MS - 1));
}

function localDateKeyFromValue(dateValue: string, timeZone: string) {
  if (isDateOnlyValue(dateValue)) {
    return dateValue;
  }

  return toIsoDate(new Date(dateValue), timeZone);
}

export function isSameWeek(dateValue: string, reference: Date, timeZone: string) {
  const targetKey = localDateKeyFromValue(dateValue, timeZone);
  const weekStart = toIsoDate(startOfWeek(reference, timeZone));
  const weekEnd = shiftDateKey(weekStart, 6);

  return targetKey >= weekStart && targetKey <= weekEnd;
}

export function daysUntil(dateValue?: string, reference = new Date(), timeZone = "UTC") {
  if (!dateValue) {
    return null;
  }

  if (isDateOnlyValue(dateValue)) {
    return dateKeyToDayNumber(dateValue) - dateKeyToDayNumber(toIsoDate(reference, timeZone));
  }

  const target = new Date(dateValue);
  return Math.ceil((target.getTime() - reference.getTime()) / DAY_IN_MS);
}

export function isOverdue(dateValue?: string, reference = new Date(), timeZone = "UTC") {
  if (!dateValue) {
    return false;
  }

  if (isDateOnlyValue(dateValue)) {
    return dateValue < toIsoDate(reference, timeZone);
  }

  return new Date(dateValue).getTime() < reference.getTime();
}

export function compareDueDates(left?: string, right?: string, reference = new Date(), timeZone = "UTC") {
  if (!left && !right) {
    return 0;
  }
  if (!left) {
    return 1;
  }
  if (!right) {
    return -1;
  }

  const leftOverdue = isOverdue(left, reference, timeZone);
  const rightOverdue = isOverdue(right, reference, timeZone);
  if (leftOverdue !== rightOverdue) {
    return leftOverdue ? -1 : 1;
  }

  const leftDelta = daysUntil(left, reference, timeZone) ?? Number.POSITIVE_INFINITY;
  const rightDelta = daysUntil(right, reference, timeZone) ?? Number.POSITIVE_INFINITY;
  if (leftDelta !== rightDelta) {
    return leftDelta - rightDelta;
  }

  if (isDateOnlyValue(left) && isDateOnlyValue(right)) {
    return left.localeCompare(right);
  }

  return left.localeCompare(right);
}

export function formatDueLabel(dateValue?: string, timeZone = "UTC") {
  if (!dateValue) {
    return undefined;
  }

  if (isDateOnlyValue(dateValue)) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(middayUtcForDateOnly(dateValue));
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

export function formatLocalDateLabel(dateValue: string, timeZone: string) {
  const value = isDateOnlyValue(dateValue) ? middayUtcForDateOnly(dateValue) : new Date(dateValue);
  const zone = isDateOnlyValue(dateValue) ? "UTC" : timeZone;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(value);
}

function formatClockTime(dateValue: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

export function formatLocalTimeRangeLabel(start: string, end: string, timeZone: string, allDay: boolean) {
  if (allDay) {
    return "All day";
  }

  return `${formatClockTime(start, timeZone)}-${formatClockTime(end, timeZone)}`;
}

export function countWorkdaysBeforeToday(workdays: number[], reference: Date, timeZone: string) {
  const todayIndex = WEEKDAY_INDEX.get(localWeekday(reference, timeZone)) ?? 0;
  const activeDays = new Set(workdays);
  return WEEKDAY_ORDER.slice(0, todayIndex).filter((day) => activeDays.has(day)).length;
}

export function roundPlannerNumber(value: number) {
  return formatNumber(value);
}
