import { describe, expect, it } from "vitest";

import type { NormalizedTask, PlannerSettings } from "@/lib/core/types";
import { getBlockingCalendarEvents } from "@/lib/planner/calendar";
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
  calendarEventHandling: "all_busy",
  calendarOwnerIdentifiers: [],
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
    expect(plan.priorityTasks[0]?.area).toBe("HTG");
    expect(plan.primaryFocus).toBe("How-To Geek output");
  });

  it("keeps cross-area visibility while preserving the full ranked backlog", () => {
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
            isOverdue: true,
            isBlocked: false,
            dueDate: "2026-03-06",
          },
          {
            id: "htg-2",
            source: "asana",
            sourceId: "2",
            area: "HTG",
            title: "Second HTG draft",
            status: "open",
            isOverdue: true,
            isBlocked: false,
            dueDate: "2026-03-06",
          },
          {
            id: "htg-3",
            source: "asana",
            sourceId: "3",
            area: "HTG",
            title: "Third HTG draft",
            status: "open",
            isOverdue: false,
            isBlocked: false,
            dueDate: "2026-03-07",
          },
          {
            id: "tlw-1",
            source: "todoist",
            sourceId: "4",
            area: "TLW",
            title: "Ship TLW follow-up",
            status: "open",
            isOverdue: false,
            isBlocked: false,
            dueDate: "2026-03-07",
          },
          {
            id: "cw-1",
            source: "todoist",
            sourceId: "5",
            area: "CREATED_WORKSHOP",
            title: "Prep Created Workshop sponsor notes",
            status: "open",
            isOverdue: false,
            isBlocked: false,
            sponsorRisk: true,
            dueDate: "2026-03-07",
          },
          {
            id: "admin-1",
            source: "todoist",
            sourceId: "6",
            area: "ADMIN",
            title: "Low priority admin cleanup",
            status: "open",
            isOverdue: false,
            isBlocked: false,
          },
          {
            id: "htg-4",
            source: "asana",
            sourceId: "7",
            area: "HTG",
            title: "Fourth HTG draft",
            status: "open",
            isOverdue: false,
            isBlocked: false,
            dueDate: "2026-03-08",
          },
          {
            id: "tlw-2",
            source: "todoist",
            sourceId: "8",
            area: "TLW",
            title: "Second TLW follow-up",
            status: "open",
            isOverdue: false,
            isBlocked: false,
            dueDate: "2026-03-08",
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

    expect(plan.priorityTasks).toHaveLength(5);
    expect(plan.priorityTasks.some((task) => task.area === "TLW")).toBe(true);
    expect(plan.priorityTasks.some((task) => task.area === "CREATED_WORKSHOP")).toBe(true);
    expect(plan.priorityTasks[0]?.area).toBe("HTG");
    expect(plan.otherTasks.length).toBeGreaterThan(0);
    expect(plan.rankedTasks.length).toBe(8);
  });

  it("caps HTG priority tasks while still surfacing overflow work lower down", () => {
    const tasks: NormalizedTask[] = [
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `htg-${index + 1}`,
        source: "asana" as const,
        sourceId: String(index + 1),
        area: "HTG" as const,
        title: `HTG article ${index + 1}`,
        status: "open" as const,
        isOverdue: index < 2,
        isBlocked: false,
        dueDate: "2026-03-06",
      })),
      {
        id: "tlw-1",
        source: "todoist",
        sourceId: "10",
        area: "TLW",
        title: "TLW customer follow-up",
        status: "open",
        isOverdue: false,
        isBlocked: false,
        dueDate: "2026-03-06",
      },
    ];

    const plan = buildTodayPlan(
      {
        tasks,
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

    expect(plan.priorityTasks.filter((task) => task.area === "HTG")).toHaveLength(3);
    expect(plan.otherTasks.some((task) => task.area === "HTG")).toBe(true);
    expect(plan.priorityTasks.some((task) => task.area === "TLW")).toBe(true);
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
    expect(plan.priorityTasks[0]?.area).toBe("CREATED_WORKSHOP");
    expect(plan.warnings[0]).toContain("Sponsor");
  });

  it("can block only owned calendar appointments", () => {
    const blockingEvents = getBlockingCalendarEvents(
      [
        {
          id: "event-1",
          source: "calendar",
          sourceId: "event-1",
          title: "Team standup",
          start: "2026-03-06T15:00:00.000Z",
          end: "2026-03-06T15:30:00.000Z",
          allDay: false,
          isBusy: true,
          organizerEmail: "ops@example.com",
        },
        {
          id: "event-2",
          source: "calendar",
          sourceId: "event-2",
          title: "Patrick dentist appointment",
          start: "2026-03-06T18:00:00.000Z",
          end: "2026-03-06T19:00:00.000Z",
          allDay: false,
          isBusy: true,
          organizerEmail: "patrick@patrickcampanale.com",
          selfAttendee: true,
          responseStatus: "accepted",
        },
      ],
      {
        ...settings,
        calendarEventHandling: "owned_only",
        calendarOwnerIdentifiers: ["patrick@patrickcampanale.com", "Patrick"],
      },
    );

    expect(blockingEvents).toHaveLength(1);
    expect(blockingEvents[0]?.id).toBe("event-2");
  });
});
