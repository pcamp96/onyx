export interface EncryptionContext {
  provider: string;
  userId?: string;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyId: string;
  algorithm: string;
  version: string;
}

export interface EncryptionProvider {
  encrypt(plaintext: string, context: EncryptionContext): Promise<EncryptedPayload>;
  decrypt(payload: EncryptedPayload, context: EncryptionContext): Promise<string>;
  getKeyMetadata(): { keyId: string; algorithm: string; version: string };
}
