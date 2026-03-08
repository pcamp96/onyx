export function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function toMonthKey(value: Date) {
  return value.toISOString().slice(0, 7);
}

export function toWeekKey(value: Date) {
  return toIsoDate(startOfWeek(value));
}

export function startOfWeek(value: Date) {
  const date = new Date(value);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfWeek(value: Date) {
  const date = startOfWeek(value);
  date.setDate(date.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function isSameWeek(dateValue: string, reference: Date) {
  const date = new Date(dateValue);
  return date >= startOfWeek(reference) && date <= endOfWeek(reference);
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

function isDateOnlyValue(dateValue: string) {
  return DATE_ONLY_PATTERN.test(dateValue);
}

function parseDateOnlyValue(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date) {
  const date = startOfDay(value);
  date.setDate(date.getDate() + 1);
  date.setMilliseconds(-1);
  return date;
}

export function daysUntil(dateValue?: string, reference = new Date()) {
  if (!dateValue) {
    return null;
  }

  if (isDateOnlyValue(dateValue)) {
    const targetDay = startOfDay(parseDateOnlyValue(dateValue));
    const referenceDay = startOfDay(reference);
    return Math.round((targetDay.getTime() - referenceDay.getTime()) / DAY_IN_MS);
  }

  const target = new Date(dateValue);
  return Math.ceil((target.getTime() - reference.getTime()) / DAY_IN_MS);
}

export function isOverdue(dateValue?: string, reference = new Date()) {
  if (!dateValue) {
    return false;
  }

  if (isDateOnlyValue(dateValue)) {
    return endOfDay(parseDateOnlyValue(dateValue)).getTime() < reference.getTime();
  }

  return new Date(dateValue).getTime() < reference.getTime();
}
