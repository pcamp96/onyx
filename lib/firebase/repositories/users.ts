import type { UserProfile } from "@/lib/core/types";
import { getDb } from "@/lib/firebase/firestore";
import { nowIso, toPlainObject } from "@/lib/firebase/repositories/base";

const COLLECTION = "users";

export const usersRepository = {
  async get(userId: string): Promise<UserProfile | null> {
    const snapshot = await getDb().collection(COLLECTION).doc(userId).get();
    if (!snapshot.exists) {
      return null;
    }

    return { id: snapshot.id, ...toPlainObject(snapshot.data() as Omit<UserProfile, "id">) };
  },

  async upsert(userId: string, profile: Partial<UserProfile>) {
    const ref = getDb().collection(COLLECTION).doc(userId);
    const existing = await ref.get();
    const payload = {
      email: profile.email ?? "",
      displayName: profile.displayName ?? "",
      role: "admin" as const,
      status: profile.status ?? "active",
      createdAt: existing.exists ? (existing.data()?.createdAt ?? nowIso()) : nowIso(),
      updatedAt: nowIso(),
      lastLoginAt: profile.lastLoginAt ?? existing.data()?.lastLoginAt ?? nowIso(),
    };

    await ref.set(payload, { merge: true });
    return this.get(userId);
  },
};
