import { describe, expect, it } from "vitest";

import type { PlannerSettings } from "@/lib/core/types";
import { buildDefaultGptSetupPreferences } from "@/lib/firebase/repositories/gpt-setup-preferences";
import type { GptSetupPreferences } from "@/lib/gpt/types";

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
      preferences: buildDefaultGptSetupPreferences("user-1", "user-1", "Patrick"),
    });

    expect(setup.baseUrl).toBe("https://onyx.example.com");
    expect(setup.schemaUrl).toBe("https://onyx.example.com/api/openapi.json");
    expect(setup.schemaYamlUrl).toBe("https://onyx.example.com/api/openapi.yaml");
    expect(setup.authHeaderName).toBe("Authorization");
    expect(setup.instructions).toContain("priority engine");
    expect(setup.instructions).toContain("not a scheduler");
    expect(setup.instructions).toContain("HTG usually comes first.");
    expect(setup.instructions).toContain("America/Chicago");
    expect(setup.instructions).toContain("/api/founder/ideas");
    expect(setup.instructions).toContain("/api/founder/tlw/overview");
    expect(setup.instructions).toContain("External API Rules");
    expect(setup.instructions).toContain("Never ask the user for the TLW token.");
    expect(setup.instructions).toContain("If /today returns tlwOperatorPlan");
    expect(setup.instructions).toContain("If /today returns tomorrowTasks");
    expect(setup.instructions).toContain("Remaining Due or Overdue Work");
    expect(setup.instructions).toContain("Do not omit them just because Top Priorities is full.");
    expect(setup.instructions).toContain("If /week returns rankedPrioritiesRemainingCount above zero");
    expect(setup.instructions).toContain("If /ideas returns rankedContextRemainingCount above zero");
    expect(setup.actionInstructions).toContain("add a new custom action");
    expect(setup.actionInstructions).toContain("getFounderDailyPriorities");
    expect(setup.actionSchemaYaml).toContain("openapi: 3.1.0");
    expect(setup.authNotes).toContain("Bearer <token>");
    expect(setup.checklist[2]).toContain("Authorization");
    expect(setup.conversationStarters).toContain("/ideas");
    expect(setup.conversationStarters).toContain("/tlw-overview");
    expect(setup.preferences.assistantName).toBe("Onyx");
  });

  it("uses custom preferences in the generated instructions", () => {
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

    const preferences = {
      ...buildDefaultGptSetupPreferences("user-1", "user-1", "Patrick"),
      assistantName: "Operator Onyx",
      roleDescription: "growth operator",
      jobDescription: "Turn live founder priorities into clear actions and weekly leverage.",
      toneRules: ["Casual.", "Direct."],
      customInstructionsAppendix: "Always end with one concrete next step.",
    };

    const setup = buildGptSetupData({
      credential: null,
      settings,
      preferences,
    });

    expect(setup.instructions).toContain("You are Operator Onyx, Patrick's growth operator.");
    expect(setup.instructions).toContain("Turn live founder priorities into clear actions and weekly leverage.");
    expect(setup.instructions).toContain("Tone\nCasual.\nDirect.");
    expect(setup.instructions).toContain("Always end with one concrete next step.");
  });

  it("fills in newly added preference arrays for legacy preference records", () => {
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

    const legacyPreferences = {
      ...buildDefaultGptSetupPreferences("user-1", "user-1", "Patrick"),
      externalApiRules: undefined,
    } as unknown as GptSetupPreferences;

    const setup = buildGptSetupData({
      credential: null,
      settings,
      preferences: {
        ...legacyPreferences,
        externalApiRules:
          legacyPreferences.externalApiRules ??
          buildDefaultGptSetupPreferences("user-1", "user-1", "Patrick").externalApiRules,
      },
    });

    expect(setup.preferences.externalApiRules.length).toBeGreaterThan(0);
    expect(setup.instructions).toContain("External API Rules");
  });
});
