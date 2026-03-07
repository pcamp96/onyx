import { beforeEach, describe, expect, it, vi } from "vitest";

describe("local encryption provider", () => {
  beforeEach(() => {
    process.env.FIREBASE_PROJECT_ID = "demo-project";
    process.env.FIREBASE_CLIENT_EMAIL = "demo@example.com";
    process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----";
    process.env.FIREBASE_WEB_API_KEY = "demo";
    process.env.FIREBASE_AUTH_DOMAIN = "demo.firebaseapp.com";
    process.env.FIREBASE_APP_ID = "1:123:web:demo";
    process.env.ONYX_ENCRYPTION_PROVIDER = "local";
    process.env.ONYX_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    vi.resetModules();
  });

  it("round-trips encrypted secrets", async () => {
    const { encryptIntegrationSecret, decryptIntegrationSecret } = await import("@/lib/security/secrets");

    const encrypted = await encryptIntegrationSecret("asana", "super-secret-token", "founder");
    const decrypted = await decryptIntegrationSecret("asana", encrypted, "founder");

    expect(encrypted.ciphertext).not.toContain("super-secret-token");
    expect(decrypted).toBe("super-secret-token");
  });
});
