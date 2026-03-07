import type { EncryptedSecretRecord, IntegrationProvider } from "@/lib/core/types";
import type { EncryptedPayload } from "@/lib/security/encryption-provider";
import { getDb } from "@/lib/firebase/firestore";
import { nowIso, toPlainObject } from "@/lib/firebase/repositories/base";

const COLLECTION = "integration_secrets";

export const secretsRepository = {
  async get(provider: IntegrationProvider): Promise<EncryptedSecretRecord | null> {
    const snapshot = await getDb().collection(COLLECTION).doc(provider).get();
    if (!snapshot.exists) {
      return null;
    }

    return toPlainObject(snapshot.data() as EncryptedSecretRecord);
  },

  async save(
    provider: IntegrationProvider,
    payload: EncryptedPayload & {
      updatedBy: string;
    },
  ) {
    const record: EncryptedSecretRecord = {
      provider,
      ...payload,
      updatedAt: nowIso(),
      updatedBy: payload.updatedBy,
    };

    await getDb().collection(COLLECTION).doc(provider).set(record, { merge: true });
    return record;
  },
};
