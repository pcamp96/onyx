import type { PlanningSnapshot } from "@/lib/core/types";
import { getDb } from "@/lib/firebase/firestore";
import { nowIso, toPlainObject } from "@/lib/firebase/repositories/base";

const COLLECTION = "planning_snapshots";

export const planningSnapshotsRepository = {
  async save(snapshot: Omit<PlanningSnapshot, "id" | "createdAt">) {
    const ref = getDb().collection(COLLECTION).doc();
    const payload: PlanningSnapshot = {
      ...snapshot,
      id: ref.id,
      createdAt: nowIso(),
    };
    await ref.set(payload);
    return payload;
  },

  async getLatest(userId: string, type: "today" | "week"): Promise<PlanningSnapshot | null> {
    const query = await getDb()
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("type", "==", type)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (query.empty) {
      return null;
    }

    return toPlainObject(query.docs[0]?.data() as PlanningSnapshot);
  },
};
