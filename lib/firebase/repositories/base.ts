import { Timestamp } from "firebase-admin/firestore";

import { getDb } from "@/lib/firebase/firestore";

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

export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefinedDeep(entry)) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, stripUndefinedDeep(entry)]),
  ) as T;
}

export function userDocument(userId: string) {
  return getDb().collection("users").doc(userId);
}
