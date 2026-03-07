import { getServerEnv } from "@/lib/config/env";
import type { IntegrationProvider } from "@/lib/core/types";
import { KmsEncryptionProvider } from "@/lib/security/kms-encryption";
import { LocalEncryptionProvider } from "@/lib/security/local-encryption";
import type { EncryptedPayload, EncryptionProvider } from "@/lib/security/encryption-provider";

let provider: EncryptionProvider | null = null;

function getEncryptionProvider() {
  if (provider) {
    return provider;
  }

  const env = getServerEnv();
  provider =
    env.ONYX_ENCRYPTION_PROVIDER === "kms"
      ? new KmsEncryptionProvider()
      : new LocalEncryptionProvider();

  return provider;
}

export async function encryptIntegrationSecret(
  integrationProvider: IntegrationProvider,
  plaintext: string,
  userId: string,
) {
  return getEncryptionProvider().encrypt(plaintext, {
    provider: integrationProvider,
    userId,
  });
}

export async function decryptIntegrationSecret(
  integrationProvider: IntegrationProvider,
  payload: EncryptedPayload,
  userId: string,
) {
  return getEncryptionProvider().decrypt(payload, {
    provider: integrationProvider,
    userId,
  });
}

export function getEncryptionMetadata() {
  return getEncryptionProvider().getKeyMetadata();
}
