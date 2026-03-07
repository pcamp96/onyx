import type { PluginRegistryRecord } from "@/lib/core/types";
import { getDb } from "@/lib/firebase/firestore";
import { toPlainObject } from "@/lib/firebase/repositories/base";

const COLLECTION = "plugin_registry";

export const pluginRegistryRepository = {
  async list(): Promise<PluginRegistryRecord[]> {
    const snapshot = await getDb().collection(COLLECTION).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...toPlainObject(doc.data() as Omit<PluginRegistryRecord, "id">) }));
  },
};
