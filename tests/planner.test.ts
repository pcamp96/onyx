import { describe, expect, it } from "vitest";

import type { PlannerSettings } from "@/lib/core/types";
import { buildTodayPlan } from "@/lib/planner/today";

const settings: PlannerSettings = {
  userId: "founder",
  weeklyArticleMinimum: 11,
  weeklyArticleGoal: 15,
  createdWorkshopLowPriorityEnabled: true,
  sponsorUrgencyDays: 10,
  maxTodayTasks: 5,
  timezone: "America/Chicago",
  workdays: [1, 2, 3, 4, 5],
  sundayNoWork: true,
  areaWeights: {
    HTG: 40,
    TLW: 28,
    CREATED_WORKSHOP: 12,
    ADMIN: 4,
  },
  createdAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-03-06T00:00:00.000Z",
  updatedBy: "founder",
};

describe("today planner", () => {
  it("prefers HTG pace work by default", () => {
    const plan = buildTodayPlan(
      {
        tasks: [
          {
            id: "htg-1",
            source: "asana",
            sourceId: "1",
            area: "HTG",
            title: "Submit HTG article",
            status: "open",
            isOverdue: false,
            isBlocked: false,
          },
          {
            id: "tlw-1",
            source: "todoist",
            sourceId: "2",
            area: "TLW",
            title: "Laser Workshop cleanup",
            status: "open",
            isOverdue: false,
            isBlocked: false,
          },
        ],
        calendarEvents: [],
        articleEntries: [],
        warnings: [],
        debugRecord: {
          date: "2026-03-06",
          generatedAt: "2026-03-06T12:00:00.000Z",
          providerSummaries: {},
          normalizedInputPreview: {
            tasks: [],
            calendarEvents: [],
            articleEntries: [],
          },
        },
      },
      settings,
      new Date("2026-03-06T12:00:00.000Z"),
    );

    expect(plan.rankedTasks[0]?.area).toBe("HTG");
    expect(plan.primaryFocus).toBe("How-To Geek output");
  });

  it("promotes created workshop when sponsor risk is present", () => {
    const plan = buildTodayPlan(
      {
        tasks: [
          {
            id: "created-1",
            source: "asana",
            sourceId: "1",
            area: "CREATED_WORKSHOP",
            title: "Deliver sponsor segment",
            status: "open",
            isOverdue: false,
            isBlocked: false,
            sponsorRisk: true,
            dueDate: "2026-03-08T12:00:00.000Z",
          },
          {
            id: "admin-1",
            source: "todoist",
            sourceId: "2",
            area: "ADMIN",
            title: "Inbox cleanup",
            status: "open",
            isOverdue: false,
            isBlocked: false,
          },
        ],
        calendarEvents: [],
        articleEntries: [],
        warnings: [],
        debugRecord: {
          date: "2026-03-06",
          generatedAt: "2026-03-06T12:00:00.000Z",
          providerSummaries: {},
          normalizedInputPreview: {
            tasks: [],
            calendarEvents: [],
            articleEntries: [],
          },
        },
      },
      settings,
      new Date("2026-03-06T12:00:00.000Z"),
    );

    expect(plan.rankedTasks[0]?.area).toBe("CREATED_WORKSHOP");
    expect(plan.warnings[0]).toContain("Sponsor");
  });
});
