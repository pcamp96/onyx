import { PROVIDERS } from "@/lib/config/constants";
import type { GoogleSheetConfig, IntegrationProvider, IntegrationRecord } from "@/lib/core/types";
import { getDb } from "@/lib/firebase/firestore";
import { nowIso, toPlainObject } from "@/lib/firebase/repositories/base";

const INTEGRATIONS_COLLECTION = "integrations";
const GOOGLE_SHEETS_CONFIG_COLLECTION = "google_sheet_configs";

function defaultIntegration(provider: IntegrationProvider): IntegrationRecord {
  return {
    provider,
    enabled: false,
    status: "idle",
    configRef: provider === "google-sheets" ? GOOGLE_SHEETS_CONFIG_COLLECTION : provider,
    secretRef: provider,
    updatedAt: nowIso(),
    updatedBy: "system",
  };
}

export const integrationsRepository = {
  async list(): Promise<IntegrationRecord[]> {
    const snapshots = await Promise.all(PROVIDERS.map((provider) => this.get(provider)));
    return snapshots;
  },

  async get(provider: IntegrationProvider): Promise<IntegrationRecord> {
    const snapshot = await getDb().collection(INTEGRATIONS_COLLECTION).doc(provider).get();
    if (!snapshot.exists) {
      return defaultIntegration(provider);
    }

    return toPlainObject(snapshot.data() as IntegrationRecord);
  },

  async save(provider: IntegrationProvider, input: Partial<IntegrationRecord> & { updatedBy: string }) {
    const current = await this.get(provider);
    const payload: IntegrationRecord = {
      ...current,
      ...input,
      provider,
      updatedAt: nowIso(),
    };

    await getDb().collection(INTEGRATIONS_COLLECTION).doc(provider).set(payload, { merge: true });
    return payload;
  },
};

export const googleSheetConfigRepository = {
  async get(userId: string): Promise<GoogleSheetConfig | null> {
    const snapshot = await getDb().collection(GOOGLE_SHEETS_CONFIG_COLLECTION).doc(userId).get();
    if (!snapshot.exists) {
      return null;
    }

    return toPlainObject(snapshot.data() as GoogleSheetConfig);
  },

  async save(userId: string, input: Omit<GoogleSheetConfig, "userId" | "updatedAt"> & { updatedBy: string }) {
    const payload: GoogleSheetConfig = {
      ...input,
      userId,
      updatedAt: nowIso(),
    };

    await getDb().collection(GOOGLE_SHEETS_CONFIG_COLLECTION).doc(userId).set(payload, { merge: true });
    return payload;
  },
};
