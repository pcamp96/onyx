import type { SponsorProject } from "@/lib/core/types";
import { getDb } from "@/lib/firebase/firestore";
import { toPlainObject } from "@/lib/firebase/repositories/base";

const COLLECTION = "sponsor_projects";

export const sponsorProjectsRepository = {
  async list(): Promise<SponsorProject[]> {
    const snapshot = await getDb().collection(COLLECTION).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...toPlainObject(doc.data() as Omit<SponsorProject, "id">) }));
  },
};
