import { DEFAULT_PLANNER_SETTINGS } from "@/lib/config/constants";
import type { PlannerSettings } from "@/lib/core/types";
import { getDb } from "@/lib/firebase/firestore";
import { nowIso, toPlainObject } from "@/lib/firebase/repositories/base";

const COLLECTION = "planner_settings";

export const plannerSettingsRepository = {
  async get(userId: string): Promise<PlannerSettings> {
    const snapshot = await getDb().collection(COLLECTION).doc(userId).get();
    if (!snapshot.exists) {
      return {
        ...DEFAULT_PLANNER_SETTINGS,
        userId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
    }

    return toPlainObject(snapshot.data() as PlannerSettings);
  },

  async save(userId: string, input: Partial<PlannerSettings> & { updatedBy: string }) {
    const current = await this.get(userId);
    const payload: PlannerSettings = {
      ...current,
      ...input,
      userId,
      updatedAt: nowIso(),
    };

    if (!current.createdAt) {
      payload.createdAt = nowIso();
    }

    await getDb().collection(COLLECTION).doc(userId).set(payload, { merge: true });
    return payload;
  },
};
