import type { EncryptedPayload, EncryptionContext, EncryptionProvider } from "@/lib/security/encryption-provider";

export class KmsEncryptionProvider implements EncryptionProvider {
  async encrypt(plaintext: string, context: EncryptionContext): Promise<EncryptedPayload> {
    void plaintext;
    void context;
    throw new Error("Google Cloud KMS provider is not implemented yet");
  }

  async decrypt(payload: EncryptedPayload, context: EncryptionContext): Promise<string> {
    void payload;
    void context;
    throw new Error("Google Cloud KMS provider is not implemented yet");
  }

  getKeyMetadata() {
    return {
      keyId: "kms-todo",
      algorithm: "kms",
      version: "stub",
    };
  }
}
