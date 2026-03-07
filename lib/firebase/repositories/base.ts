import { Timestamp } from "firebase-admin/firestore";

export function nowIso() {
  return new Date().toISOString();
}

export function toPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, entry) => {
    if (entry instanceof Timestamp) {
      return entry.toDate().toISOString();
    }

    return entry;
  })) as T;
}
