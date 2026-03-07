import type { EncryptedSecretRecord, IntegrationProvider } from "@/lib/core/types";
import type { EncryptedPayload } from "@/lib/security/encryption-provider";
import { nowIso, toPlainObject, userDocument } from "@/lib/firebase/repositories/base";

const SUBCOLLECTION = "integration_secrets";

function secretRef(userId: string, provider: IntegrationProvider) {
  return userDocument(userId).collection<EncryptedSecretRecord>(SUBCOLLECTION).doc(provider);
}

export const secretsRepository = {
  async get(userId: string, provider: IntegrationProvider): Promise<EncryptedSecretRecord | null> {
    const snapshot = await secretRef(userId, provider).get();
    if (!snapshot.exists) {
      return null;
    }

    return toPlainObject(snapshot.data() as unknown as EncryptedSecretRecord);
  },

  async save(
    userId: string,
    provider: IntegrationProvider,
    payload: EncryptedPayload & {
      updatedBy: string;
    },
  ) {
    const record: EncryptedSecretRecord = {
      userId,
      provider,
      ...payload,
      updatedAt: nowIso(),
      updatedBy: payload.updatedBy,
    };

    await secretRef(userId, provider).set(record, { merge: true });
    return record;
  },
};
