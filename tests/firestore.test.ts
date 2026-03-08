import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.APP_URL = process.env.APP_URL ?? "https://onyx.example.com";
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "demo-project";
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL ?? "demo@example.com";
process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY ?? "private-key";
process.env.FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY ?? "web-api-key";
process.env.FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN ?? "demo.firebaseapp.com";
process.env.FIREBASE_APP_ID = process.env.FIREBASE_APP_ID ?? "app-id";
process.env.ONYX_ENCRYPTION_KEY = process.env.ONYX_ENCRYPTION_KEY ?? "test-encryption-key";

const admin = vi.hoisted(() => ({
  getGoogleAccessToken: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({
  getGoogleAccessToken: admin.getGoogleAccessToken,
}));

import { getDb } from "@/lib/firebase/firestore";

describe("firestore collection group queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    admin.getGoogleAccessToken.mockResolvedValue("access-token");
  });

  it("preserves collection group behavior when chaining filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock);

    await getDb()
      .collectionGroup("gpt_api_credentials")
      .where("tokenHash", "==", "hash-value")
      .limit(1)
      .get();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/documents:runQuery");
    const body = JSON.parse(String(init.body));
    expect(body.structuredQuery.from).toEqual([
      { collectionId: "gpt_api_credentials", allDescendants: true },
    ]);
    expect(body.structuredQuery.where).toEqual({
      fieldFilter: {
        field: { fieldPath: "tokenHash" },
        op: "EQUAL",
        value: { stringValue: "hash-value" },
      },
    });
  });
});
