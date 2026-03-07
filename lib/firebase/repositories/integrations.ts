import { PROVIDERS } from "@/lib/core/constants";
import type {
  GoogleSheetConfig,
  IntegrationConfigRecord,
  IntegrationProvider,
  IntegrationRecord,
} from "@/lib/core/types";
import { nowIso, stripUndefinedDeep, toPlainObject, userDocument } from "@/lib/firebase/repositories/base";

const INTEGRATIONS_SUBCOLLECTION = "integrations";
const INTEGRATION_CONFIGS_SUBCOLLECTION = "integration_configs";

function integrationRef(userId: string, provider: IntegrationProvider) {
  return userDocument(userId).collection(INTEGRATIONS_SUBCOLLECTION).doc(provider);
}

function integrationConfigRef(userId: string, provider: IntegrationProvider) {
  return userDocument(userId).collection(INTEGRATION_CONFIGS_SUBCOLLECTION).doc(provider);
}

function defaultIntegration(userId: string, provider: IntegrationProvider): IntegrationRecord {
  return {
    userId,
    provider,
    enabled: false,
    status: "idle",
    configRef: `users/${userId}/${INTEGRATION_CONFIGS_SUBCOLLECTION}/${provider}`,
    secretRef: `users/${userId}/integration_secrets/${provider}`,
    updatedAt: nowIso(),
    updatedBy: "system",
  };
}

export const integrationsRepository = {
  async list(userId: string): Promise<IntegrationRecord[]> {
    const snapshots = await Promise.all(PROVIDERS.map((provider) => this.get(userId, provider)));
    return snapshots;
  },

  async get(userId: string, provider: IntegrationProvider): Promise<IntegrationRecord> {
    const snapshot = await integrationRef(userId, provider).get();
    if (!snapshot.exists) {
      return defaultIntegration(userId, provider);
    }

    return toPlainObject(snapshot.data() as IntegrationRecord);
  },

  async save(
    userId: string,
    provider: IntegrationProvider,
    input: Partial<IntegrationRecord> & { updatedBy: string },
  ) {
    const current = await this.get(userId, provider);
    const payload: IntegrationRecord = {
      ...current,
      ...input,
      userId,
      provider,
      updatedAt: nowIso(),
    };

    const sanitizedPayload = stripUndefinedDeep(payload);
    await integrationRef(userId, provider).set(sanitizedPayload, { merge: true });
    return sanitizedPayload;
  },
};

export const integrationConfigsRepository = {
  async list(userId: string): Promise<IntegrationConfigRecord[]> {
    const snapshot = await userDocument(userId).collection(INTEGRATION_CONFIGS_SUBCOLLECTION).get();
    return snapshot.docs.map((doc) => toPlainObject(doc.data() as IntegrationConfigRecord));
  },

  async get(userId: string, provider: IntegrationProvider): Promise<IntegrationConfigRecord | null> {
    const snapshot = await integrationConfigRef(userId, provider).get();
    if (!snapshot.exists) {
      return null;
    }

    return toPlainObject(snapshot.data() as IntegrationConfigRecord);
  },

  async save(
    userId: string,
    provider: IntegrationProvider,
    values: Record<string, unknown>,
    updatedBy: string,
  ): Promise<IntegrationConfigRecord> {
    const current = await this.get(userId, provider);
    const payload: IntegrationConfigRecord = {
      userId,
      provider,
      values,
      createdAt: current?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
      updatedBy,
    };

    const sanitizedPayload = stripUndefinedDeep(payload);
    await integrationConfigRef(userId, provider).set(sanitizedPayload, { merge: true });
    return sanitizedPayload;
  },

  async getGoogleSheetsConfig(userId: string): Promise<GoogleSheetConfig | null> {
    const record = await this.get(userId, "google-sheets");
    if (!record) {
      return null;
    }

    return record.values as unknown as GoogleSheetConfig;
  },
};
