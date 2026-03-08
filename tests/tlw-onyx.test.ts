import { afterEach, describe, expect, it, vi } from "vitest";

import { TlwOnyxAdapter } from "@/lib/integrations/tlw-onyx/adapter";

describe("TlwOnyxAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tests the TLW API with the required custom header", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          snapshot: {
            users_total: 364,
            settings_total: 26,
            generated_at: "2026-03-08T01:44:53.033Z",
          },
          analytics: {
            top_channel: "unknown",
            generated_at: "2026-03-08T01:44:53.068Z",
          },
          generated_at: "2026-03-08T01:44:53.068Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const adapter = new TlwOnyxAdapter();
    const result = await adapter.testConnection({
      userId: "user-1",
      secret: "tlw-token",
      config: { baseUrl: "https://thelaserworkshop.com" },
      now: new Date("2026-03-08T12:00:00.000Z"),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://thelaserworkshop.com/api/onyx/overview?window_days=7",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          "x-onyx-token": "tlw-token",
        },
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.message).toBe("TLW Onyx API connected");
  });

  it("syncs TLW overview data without contributing planner tasks", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          snapshot: {
            users_total: 364,
            settings_total: 26,
            generated_at: "2026-03-08T01:44:53.033Z",
          },
          analytics: {
            top_channel: "unknown",
            generated_at: "2026-03-08T01:44:53.068Z",
          },
          generated_at: "2026-03-08T01:44:53.068Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const adapter = new TlwOnyxAdapter();
    const result = await adapter.sync({
      userId: "user-1",
      secret: "tlw-token",
      config: null,
      now: new Date("2026-03-08T12:00:00.000Z"),
    });

    expect(result.tasks).toEqual([]);
    expect(result.calendarEvents).toEqual([]);
    expect(result.articleEntries).toEqual([]);
    expect(result.rawPreview).toHaveProperty("overview");
  });
});
