import type { PlanningDebugRecord, PlanningSnapshot } from "@/lib/core/types";
import { nowIso, toPlainObject, userDocument } from "@/lib/firebase/repositories/base";

const SNAPSHOT_SUBCOLLECTION = "planning_snapshots";
const DEBUG_SUBCOLLECTION = "planning_debug";

function snapshotsCollection(userId: string) {
  return userDocument(userId).collection<PlanningSnapshot>(SNAPSHOT_SUBCOLLECTION);
}

function debugRef(userId: string, type: "today" | "week") {
  return userDocument(userId).collection<PlanningDebugRecord>(DEBUG_SUBCOLLECTION).doc(type);
}

export const planningSnapshotsRepository = {
  async save(userId: string, snapshot: Omit<PlanningSnapshot, "id" | "createdAt" | "userId">) {
    const ref = snapshotsCollection(userId).doc();
    const payload: PlanningSnapshot = {
      ...snapshot,
      id: ref.id,
      userId,
      createdAt: nowIso(),
    };
    await ref.set(payload);
    return payload;
  },

  async getLatest(userId: string, type: "today" | "week"): Promise<PlanningSnapshot | null> {
    const query = await snapshotsCollection(userId)
      .where("type", "==", type)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (query.empty) {
      return null;
    }

    return toPlainObject(query.docs[0]?.data() as unknown as PlanningSnapshot);
  },
};

export const planningDebugRepository = {
  async save(userId: string, type: "today" | "week", record: Omit<PlanningDebugRecord, "id" | "userId" | "type">) {
    const payload: PlanningDebugRecord = {
      ...record,
      id: type,
      userId,
      type,
    };
    await debugRef(userId, type).set(payload, { merge: true });
    return payload;
  },

  async get(userId: string, type: "today" | "week"): Promise<PlanningDebugRecord | null> {
    const snapshot = await debugRef(userId, type).get();
    if (!snapshot.exists) {
      return null;
    }

    return toPlainObject(snapshot.data() as unknown as PlanningDebugRecord);
  },
};
