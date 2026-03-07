import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { getServerEnv } from "@/lib/config/env";
import type { EncryptedPayload, EncryptionContext, EncryptionProvider } from "@/lib/security/encryption-provider";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function decodeKey() {
  const env = getServerEnv();
  const key = Buffer.from(env.ONYX_ENCRYPTION_KEY, "base64");

  if (key.byteLength !== 32) {
    throw new Error("ONYX_ENCRYPTION_KEY must be a base64 encoded 32-byte key");
  }

  return key;
}

export class LocalEncryptionProvider implements EncryptionProvider {
  private readonly key = decodeKey();

  async encrypt(plaintext: string, context: EncryptionContext): Promise<EncryptedPayload> {
    void context;
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      keyId: "local-env",
      algorithm: ALGORITHM,
      version: VERSION,
    };
  }

  async decrypt(payload: EncryptedPayload, context: EncryptionContext): Promise<string> {
    void context;
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(payload.iv, "base64"));
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, "base64")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  }

  getKeyMetadata() {
    return {
      keyId: "local-env",
      algorithm: ALGORITHM,
      version: VERSION,
    };
  }
}
