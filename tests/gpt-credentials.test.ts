import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GptApiCredentialRecord } from "@/lib/gpt/types";

process.env.APP_URL = process.env.APP_URL ?? "https://onyx.example.com";
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "demo-project";
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL ?? "demo@example.com";
process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY ?? "private-key";
process.env.FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY ?? "web-api-key";
process.env.FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN ?? "demo.firebaseapp.com";
process.env.FIREBASE_APP_ID = process.env.FIREBASE_APP_ID ?? "app-id";
process.env.ONYX_ENCRYPTION_KEY = process.env.ONYX_ENCRYPTION_KEY ?? "test-encryption-key";

const repository = vi.hoisted(() => ({
  save: vi.fn(),
  findByTokenHash: vi.fn(),
  touchLastUsed: vi.fn(),
}));

vi.mock("@/lib/firebase/repositories/gpt-api-credentials", () => ({
  gptApiCredentialsRepository: repository,
}));

import { authenticateGptApiToken, hashGptApiToken, issueGptCredential } from "@/lib/gpt/credentials";

describe("gpt credentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repository.touchLastUsed.mockResolvedValue(undefined);
  });

  it("creates a plaintext token and stores only its hash metadata", async () => {
    repository.save.mockImplementation(async (_userId: string, input: Omit<GptApiCredentialRecord, "id" | "userId" | "createdAt" | "updatedAt">) => ({
      id: "default",
      userId: "user-1",
      createdAt: "2026-03-07T00:00:00.000Z",
      updatedAt: "2026-03-07T00:00:00.000Z",
      ...input,
    }));

    const result = await issueGptCredential("user-1", "user-1");

    expect(result.token.startsWith("onyx_gpt_")).toBe(true);
    expect(repository.save).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        tokenHash: hashGptApiToken(result.token),
        tokenLastFour: result.token.slice(-4),
        status: "active",
      }),
    );
  });

  it("authenticates a valid token and touches last-used metadata", async () => {
    const token = "onyx_gpt_valid_token";
    repository.findByTokenHash.mockResolvedValue({
      id: "default",
      userId: "user-1",
      label: "Custom GPT",
      tokenHash: hashGptApiToken(token),
      tokenLastFour: token.slice(-4),
      status: "active",
      createdAt: "2026-03-07T00:00:00.000Z",
      updatedAt: "2026-03-07T00:00:00.000Z",
      updatedBy: "user-1",
    } satisfies GptApiCredentialRecord);

    const record = await authenticateGptApiToken(token);

    expect(record?.userId).toBe("user-1");
    expect(repository.touchLastUsed).toHaveBeenCalledWith("user-1");
  });

  it("rejects invalid and revoked tokens", async () => {
    repository.findByTokenHash.mockResolvedValue(null);
    await expect(authenticateGptApiToken("onyx_gpt_invalid_token")).resolves.toBeNull();

    const token = "onyx_gpt_revoked_token";
    repository.findByTokenHash.mockResolvedValue({
      id: "default",
      userId: "user-1",
      label: "Custom GPT",
      tokenHash: hashGptApiToken(token),
      tokenLastFour: token.slice(-4),
      status: "revoked",
      createdAt: "2026-03-07T00:00:00.000Z",
      updatedAt: "2026-03-07T00:00:00.000Z",
      updatedBy: "user-1",
      revokedAt: "2026-03-07T01:00:00.000Z",
    } satisfies GptApiCredentialRecord);

    await expect(authenticateGptApiToken(token)).resolves.toBeNull();
  });
});
