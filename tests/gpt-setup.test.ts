import { describe, expect, it } from "vitest";

import type { PlannerSettings } from "@/lib/core/types";

process.env.APP_URL = process.env.APP_URL ?? "https://onyx.example.com";
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "demo-project";
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL ?? "demo@example.com";
process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY ?? "private-key";
process.env.FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY ?? "web-api-key";
process.env.FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN ?? "demo.firebaseapp.com";
process.env.FIREBASE_APP_ID = process.env.FIREBASE_APP_ID ?? "app-id";
process.env.ONYX_ENCRYPTION_KEY = process.env.ONYX_ENCRYPTION_KEY ?? "test-encryption-key";

import { buildGptSetupData } from "@/lib/gpt/setup";

describe("gpt setup generator", () => {
  it("includes schema URL, auth notes, timezone, and priority guidance", () => {
    const settings: PlannerSettings = {
      userId: "user-1",
      weeklyArticleMinimum: 3,
      weeklyArticleGoal: 5,
      createdWorkshopLowPriorityEnabled: true,
      sponsorUrgencyDays: 7,
      maxTodayTasks: 5,
      timezone: "America/Chicago",
      workdays: [1, 2, 3, 4, 5],
      sundayNoWork: true,
      calendarEventHandling: "all_busy",
      calendarOwnerIdentifiers: [],
      areaWeights: {
        HTG: 10,
        TLW: 8,
        CREATED_WORKSHOP: 4,
        ADMIN: 1,
      },
      createdAt: "2026-03-07T00:00:00.000Z",
      updatedAt: "2026-03-07T00:00:00.000Z",
      updatedBy: "user-1",
    };

    const setup = buildGptSetupData({
      credential: null,
      settings,
      displayName: "Patrick",
    });

    expect(setup.baseUrl).toBe("https://onyx.example.com");
    expect(setup.schemaUrl).toBe("https://onyx.example.com/api/openapi.json");
    expect(setup.schemaYamlUrl).toBe("https://onyx.example.com/api/openapi.yaml");
    expect(setup.authHeaderName).toBe("X-Onyx-API-Key");
    expect(setup.instructions).toContain("priority engine");
    expect(setup.instructions).toContain("not a scheduler");
    expect(setup.instructions).toContain("HTG first, TLW second");
    expect(setup.instructions).toContain("America/Chicago");
    expect(setup.actionInstructions).toContain("add a new custom action");
    expect(setup.actionSchemaYaml).toContain("openapi: 3.1.0");
    expect(setup.checklist[2]).toContain("X-Onyx-API-Key");
  });
});
