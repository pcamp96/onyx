import type { CapturedItem } from "@/lib/core/types";
import { getDb } from "@/lib/firebase/firestore";
import { nowIso, toPlainObject } from "@/lib/firebase/repositories/base";

const COLLECTION = "captured_items";

export const capturedItemsRepository = {
  async create(input: Omit<CapturedItem, "id" | "createdAt">) {
    const ref = getDb().collection(COLLECTION).doc();
    const payload: CapturedItem = {
      ...input,
      id: ref.id,
      createdAt: nowIso(),
    };

    await ref.set(payload);
    return payload;
  },

  async listLatest(limit = 20) {
    const snapshot = await getDb().collection(COLLECTION).orderBy("createdAt", "desc").limit(limit).get();
    return snapshot.docs.map((doc) => toPlainObject(doc.data() as CapturedItem));
  },
};
