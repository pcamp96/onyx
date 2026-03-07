import type { SponsorProject } from "@/lib/core/types";
import { getDb } from "@/lib/firebase/firestore";
import { toPlainObject } from "@/lib/firebase/repositories/base";

const COLLECTION = "sponsor_projects";

export const sponsorProjectsRepository = {
  async list(): Promise<SponsorProject[]> {
    const snapshot = await getDb().collection<Omit<SponsorProject, "id">>(COLLECTION).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...toPlainObject(doc.data() as unknown as Omit<SponsorProject, "id">) }));
  },
};
