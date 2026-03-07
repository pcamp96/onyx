import { getDb } from "@/lib/firebase/firestore";
import { nowIso, toPlainObject, userDocument } from "@/lib/firebase/repositories/base";
import type { GptApiCredentialRecord } from "@/lib/gpt/types";

const SUBCOLLECTION = "gpt_api_credentials";
const DEFAULT_ID = "default";

function credentialRef(userId: string) {
  return userDocument(userId).collection<GptApiCredentialRecord>(SUBCOLLECTION).doc(DEFAULT_ID);
}

export const gptApiCredentialsRepository = {
  async get(userId: string): Promise<GptApiCredentialRecord | null> {
    const snapshot = await credentialRef(userId).get();
    if (!snapshot.exists) {
      return null;
    }

    return toPlainObject(snapshot.data() as unknown as GptApiCredentialRecord);
  },

  async save(userId: string, input: Omit<GptApiCredentialRecord, "id" | "userId" | "createdAt" | "updatedAt">) {
    const current = await this.get(userId);
    const timestamp = nowIso();
    const record: GptApiCredentialRecord = {
      ...current,
      id: DEFAULT_ID,
      userId,
      createdAt: current?.createdAt ?? timestamp,
      updatedAt: timestamp,
      ...input,
    };

    await credentialRef(userId).set(record, { merge: true });
    return record;
  },

  async revoke(userId: string, updatedBy: string) {
    const current = await this.get(userId);
    if (!current) {
      return null;
    }

    const record: GptApiCredentialRecord = {
      ...current,
      status: "revoked",
      revokedAt: nowIso(),
      updatedAt: nowIso(),
      updatedBy,
    };

    await credentialRef(userId).set(record, { merge: true });
    return record;
  },

  async touchLastUsed(userId: string) {
    await credentialRef(userId).set(
      {
        lastUsedAt: nowIso(),
        updatedAt: nowIso(),
      } satisfies Partial<GptApiCredentialRecord>,
      { merge: true },
    );
  },

  async findByTokenHash(tokenHash: string): Promise<GptApiCredentialRecord | null> {
    const snapshot = await getDb()
      .collectionGroup<GptApiCredentialRecord>(SUBCOLLECTION)
      .where("tokenHash", "==", tokenHash)
      .limit(1)
      .get();

    const doc = snapshot.docs[0];
    if (!doc) {
      return null;
    }

    return toPlainObject(doc.data() as unknown as GptApiCredentialRecord);
  },
};
