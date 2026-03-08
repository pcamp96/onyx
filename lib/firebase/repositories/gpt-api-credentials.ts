import { getDb } from "@/lib/firebase/firestore";
import { nowIso, toPlainObject, userDocument } from "@/lib/firebase/repositories/base";
import type { GptApiCredentialRecord } from "@/lib/gpt/types";

const SUBCOLLECTION = "gpt_api_credentials";
const DEFAULT_ID = "default";
const LOOKUP_COLLECTION = "gpt_api_credential_lookup";

type GptApiCredentialLookupRecord = {
  tokenHash: string;
  userId: string;
  credentialId: string;
  status: GptApiCredentialRecord["status"];
  updatedAt: string;
};

function credentialRef(userId: string) {
  return userDocument(userId).collection<GptApiCredentialRecord>(SUBCOLLECTION).doc(DEFAULT_ID);
}

function lookupRef(tokenHash: string) {
  return getDb().collection<GptApiCredentialLookupRecord>(LOOKUP_COLLECTION).doc(tokenHash);
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
    await lookupRef(record.tokenHash).set({
      tokenHash: record.tokenHash,
      userId,
      credentialId: DEFAULT_ID,
      status: record.status,
      updatedAt: timestamp,
    });

    if (current?.tokenHash && current.tokenHash !== record.tokenHash) {
      await lookupRef(current.tokenHash).delete();
    }

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
    await lookupRef(current.tokenHash).delete();
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

  async ensureLookup(userId: string) {
    const current = await this.get(userId);
    if (!current || current.status !== "active") {
      return current;
    }

    await lookupRef(current.tokenHash).set({
      tokenHash: current.tokenHash,
      userId,
      credentialId: DEFAULT_ID,
      status: current.status,
      updatedAt: nowIso(),
    });

    return current;
  },

  async findByTokenHash(tokenHash: string): Promise<GptApiCredentialRecord | null> {
    const lookupSnapshot = await lookupRef(tokenHash).get();
    if (!lookupSnapshot.exists) {
      return null;
    }

    const lookup = toPlainObject(lookupSnapshot.data() as unknown as GptApiCredentialLookupRecord);
    const record = await this.get(lookup.userId);
    if (!record || record.tokenHash !== tokenHash) {
      return null;
    }

    return record;
  },
};
