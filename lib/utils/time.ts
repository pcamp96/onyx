export function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
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

export function daysUntil(dateValue?: string, reference = new Date()) {
  if (!dateValue) {
    return null;
  }

  const target = new Date(dateValue);
  return Math.ceil((target.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(dateValue?: string, reference = new Date()) {
  if (!dateValue) {
    return false;
  }

  return new Date(dateValue).getTime() < reference.getTime();
}
