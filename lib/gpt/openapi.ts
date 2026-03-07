import type { PlannerTodayResult } from "@/lib/core/types";
import { getServerEnv } from "@/lib/config/env";

const sampleTodayResponse: PlannerTodayResult = {
  date: "2026-03-07",
  summary: {
    articlesSubmittedThisWeek: 2,
    weeklyMinimum: 3,
    weeklyGoal: 5,
    remainingToMinimum: 1,
    remainingToGoal: 3,
    estimatedPaySoFar: 650,
  },
  calendarConstraints: [
    {
      id: "event-1",
      source: "calendar",
      sourceId: "event-1",
      title: "Sponsor call",
      start: "2026-03-07T15:00:00.000Z",
      end: "2026-03-07T15:30:00.000Z",
      allDay: false,
      isBusy: true,
      calendarName: "Primary",
      organizerEmail: "patrick@example.com",
    },
  ],
  primaryFocus: "How-To Geek output",
  rankedTasks: [
    {
      id: "task-1",
      source: "todoist",
      sourceId: "task-1",
      sourceUrl: "https://app.todoist.com/app/task/123",
      area: "HTG",
      title: "Draft Chromebook roundup",
      status: "open",
      dueDate: "2026-03-07",
      isOverdue: false,
      isBlocked: false,
      score: 91,
      rank: 1,
      reason: "HTG output is still below weekly pace and this task has strong business impact.",
      scoreBreakdown: {
        deadlineProximity: 20,
        writingPaceGap: 16,
        incomeImpact: 8,
        businessImpact: 15,
        urgency: 12,
        areaWeight: 15,
        overdueAdjustment: 0,
        calendarCapacityAdjustment: 3,
        sponsorRiskAdjustment: 0,
        blockedAdjustment: 0,
        createdWorkshopAdjustment: 2,
      },
    },
  ],
  warnings: ["One article remains to hit the weekly minimum."],
  contentPrompts: [
    {
      category: "Build in public",
      project: "Onyx",
      prompt: "Today I pushed how Onyx turns ranked work into a clearer daily plan. The hard part was deciding which tradeoffs should stay visible to the founder.",
      hook: "Building Onyx is forcing me to make real tradeoffs instead of collecting ideas.",
    },
    {
      category: "Lesson",
      project: "The Laser Workshop",
      prompt: "One thing I learned this week while working on The Laser Workshop: founder systems break when operating friction stays hidden. It changed how I think about showing the messy work instead of just the polished output.",
      hook: "Most of the useful lessons in The Laser Workshop came from friction, not momentum.",
    },
    {
      category: "Opinion",
      project: "Unbrella",
      prompt: "Opinion: privacy-first weather products should not need ads or tracking to feel viable. My take comes from working through what actually creates trust in consumer software.",
      hook: "A lot of accepted startup advice falls apart once you look at the real operating details.",
    },
  ],
  generatedAt: "2026-03-07T14:05:00.000Z",
};

export function buildCanonicalOpenApiSpec() {
  const { APP_URL } = getServerEnv();

  return {
    openapi: "3.1.0",
    info: {
      title: "Onyx Founder API",
      version: "1.0.0",
      description: "Canonical Onyx Actions schema for ranked founder priorities and lightweight capture.",
    },
    servers: [{ url: APP_URL }],
    security: [{ OnyxApiKey: [] }],
    paths: {
      "/api/founder/today": {
        get: {
          operationId: "getFounderTodayPlan",
          summary: "Get ranked execution priorities for today",
          description:
            "Use this when the user asks what to do today. Preserve the ranked task order from the API and surface warnings clearly instead of inventing a new priority order.",
          security: [{ OnyxApiKey: [] }],
          responses: {
            "200": {
              description: "Ranked founder priorities for the current day.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PlannerTodayResult" },
                  examples: {
                    default: {
                      value: sampleTodayResponse,
                    },
                  },
                },
              },
            },
            "401": {
              description: "Missing or invalid API key.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/founder/week": {
        get: {
          operationId: "getFounderWeekPlan",
          summary: "Get weekly priority and pace overview",
          description:
            "Use this when the user asks about weekly priorities, pace, risk, or whether they are behind. Keep the ranking order and warnings from Onyx intact.",
          security: [{ OnyxApiKey: [] }],
          responses: {
            "200": {
              description: "Weekly execution and pacing overview.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PlannerWeekResult" },
                },
              },
            },
            "401": {
              description: "Missing or invalid API key.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/founder/capture": {
        post: {
          operationId: "captureFounderItem",
          summary: "Capture a new task, reminder, or idea",
          description:
            "Use this when the user wants Onyx to save a new task, idea, or reminder. Only capture what the user explicitly asked to save.",
          security: [{ OnyxApiKey: [] }],
          "x-openai-isConsequential": true,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CaptureRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Captured item saved.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CapturedItem" },
                },
              },
            },
            "400": {
              description: "Invalid capture payload.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "Missing or invalid API key.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        OnyxApiKey: {
          type: "apiKey",
          in: "header",
          name: "X-Onyx-API-Key",
          description: "Per-user Onyx GPT API key generated from the GPT Setup page.",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          required: ["error"],
          properties: {
            error: { type: "string" },
            details: {},
          },
        },
        PlannerSummary: {
          type: "object",
          required: ["articlesSubmittedThisWeek", "weeklyMinimum", "weeklyGoal", "remainingToMinimum", "remainingToGoal"],
          properties: {
            articlesSubmittedThisWeek: { type: "integer" },
            weeklyMinimum: { type: "integer" },
            weeklyGoal: { type: "integer" },
            remainingToMinimum: { type: "integer" },
            remainingToGoal: { type: "integer" },
            estimatedPaySoFar: { type: "number" },
          },
        },
        NormalizedCalendarEvent: {
          type: "object",
          required: ["id", "source", "sourceId", "title", "start", "end", "allDay", "isBusy"],
          properties: {
            id: { type: "string" },
            source: { type: "string", enum: ["calendar"] },
            sourceId: { type: "string" },
            sourceUrl: { type: "string" },
            title: { type: "string" },
            start: { type: "string" },
            end: { type: "string" },
            allDay: { type: "boolean" },
            isBusy: { type: "boolean" },
            calendarName: { type: "string" },
            organizerEmail: { type: "string" },
            organizerName: { type: "string" },
            creatorEmail: { type: "string" },
            selfAttendee: { type: "boolean" },
            responseStatus: { type: "string" },
          },
        },
        ScoreBreakdown: {
          type: "object",
          required: [
            "deadlineProximity",
            "writingPaceGap",
            "incomeImpact",
            "businessImpact",
            "urgency",
            "areaWeight",
            "overdueAdjustment",
            "calendarCapacityAdjustment",
            "sponsorRiskAdjustment",
            "blockedAdjustment",
            "createdWorkshopAdjustment",
          ],
          properties: {
            deadlineProximity: { type: "number" },
            writingPaceGap: { type: "number" },
            incomeImpact: { type: "number" },
            businessImpact: { type: "number" },
            urgency: { type: "number" },
            areaWeight: { type: "number" },
            overdueAdjustment: { type: "number" },
            calendarCapacityAdjustment: { type: "number" },
            sponsorRiskAdjustment: { type: "number" },
            blockedAdjustment: { type: "number" },
            createdWorkshopAdjustment: { type: "number" },
          },
        },
        ContentPrompt: {
          type: "object",
          required: ["category", "project", "prompt", "hook"],
          properties: {
            category: {
              type: "string",
              enum: [
                "Story",
                "Opinion",
                "Lesson",
                "Behind the scenes",
                "Build in public",
                "Problem/Solution",
                "Progress update",
                "Curiosity/question",
                "Vision",
                "Founder reflection",
              ],
            },
            project: { type: "string" },
            prompt: { type: "string" },
            hook: { type: "string" },
          },
        },
        RankedTask: {
          type: "object",
          required: [
            "id",
            "source",
            "sourceId",
            "area",
            "title",
            "status",
            "isOverdue",
            "isBlocked",
            "score",
            "rank",
            "reason",
            "scoreBreakdown",
          ],
          properties: {
            id: { type: "string" },
            source: { type: "string" },
            sourceId: { type: "string" },
            sourceUrl: { type: "string" },
            area: { type: "string", enum: ["HTG", "TLW", "CREATED_WORKSHOP", "ADMIN"] },
            title: { type: "string" },
            notes: { type: "string" },
            status: { type: "string", enum: ["open", "in_progress", "blocked", "done"] },
            dueDate: { type: "string" },
            priority: { type: "number" },
            estimatedEffort: { type: "number" },
            tags: { type: "array", items: { type: "string" } },
            isOverdue: { type: "boolean" },
            isBlocked: { type: "boolean" },
            businessImpact: { type: "number" },
            incomeImpact: { type: "number" },
            createdAt: { type: "string" },
            updatedAt: { type: "string" },
            sponsorRisk: { type: "boolean" },
            projectName: { type: "string" },
            projectId: { type: "string" },
            score: { type: "number" },
            rank: { type: "integer" },
            reason: { type: "string" },
            scoreBreakdown: { $ref: "#/components/schemas/ScoreBreakdown" },
          },
        },
        PlannerTodayResult: {
          type: "object",
          required: ["date", "summary", "calendarConstraints", "primaryFocus", "rankedTasks", "warnings", "contentPrompts"],
          properties: {
            date: { type: "string" },
            summary: { $ref: "#/components/schemas/PlannerSummary" },
            calendarConstraints: {
              type: "array",
              items: { $ref: "#/components/schemas/NormalizedCalendarEvent" },
            },
            primaryFocus: { type: "string" },
            rankedTasks: {
              type: "array",
              items: { $ref: "#/components/schemas/RankedTask" },
            },
            warnings: {
              type: "array",
              items: { type: "string" },
            },
            contentPrompts: {
              type: "array",
              items: { $ref: "#/components/schemas/ContentPrompt" },
            },
            generatedAt: { type: "string" },
          },
        },
        PlannerWeekResult: {
          type: "object",
          required: [
            "weekStart",
            "weekEnd",
            "summary",
            "primaryFocus",
            "rankedPriorities",
            "deadlineRisks",
            "warnings",
            "contentPrompts",
          ],
          properties: {
            weekStart: { type: "string" },
            weekEnd: { type: "string" },
            summary: { $ref: "#/components/schemas/PlannerSummary" },
            primaryFocus: { type: "string" },
            rankedPriorities: {
              type: "array",
              items: { $ref: "#/components/schemas/RankedTask" },
            },
            deadlineRisks: {
              type: "array",
              items: { type: "string" },
            },
            warnings: {
              type: "array",
              items: { type: "string" },
            },
            contentPrompts: {
              type: "array",
              items: { $ref: "#/components/schemas/ContentPrompt" },
            },
            generatedAt: { type: "string" },
          },
        },
        CaptureRequest: {
          type: "object",
          required: ["text"],
          properties: {
            text: {
              type: "string",
              description: "Task, reminder, or idea to save into Onyx.",
            },
          },
        },
        CapturedItem: {
          type: "object",
          required: ["id", "userId", "text", "source", "status", "createdAt", "createdBy"],
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            text: { type: "string" },
            source: { type: "string", enum: ["manual", "api", "future-plugin"] },
            status: { type: "string", enum: ["open", "processed"] },
            createdAt: { type: "string" },
            createdBy: { type: "string" },
          },
        },
      },
    },
  };
}

export function getSampleTodayResponse() {
  return sampleTodayResponse;
}

export function buildCanonicalOpenApiYaml() {
  return toYaml(buildCanonicalOpenApiSpec());
}

function toYaml(value: unknown, indent = 0): string {
  const prefix = "  ".repeat(indent);

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (isScalar(entry)) {
          return `${prefix}- ${formatScalar(entry)}`;
        }

        const nested = toYaml(entry, indent + 1);
        const lines = nested.split("\n");
        return `${prefix}- ${lines[0]?.trimStart()}\n${lines.slice(1).join("\n")}`;
      })
      .join("\n");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, entry]) => {
        if (isScalar(entry)) {
          return `${prefix}${key}: ${formatScalar(entry)}`;
        }

        if (Array.isArray(entry) && entry.length === 0) {
          return `${prefix}${key}: []`;
        }

        const nested = toYaml(entry, indent + 1);
        return `${prefix}${key}:\n${nested}`;
      })
      .join("\n");
  }

  return `${prefix}${formatScalar(value)}`;
}

function isScalar(value: unknown) {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function formatScalar(value: unknown) {
  if (value === null) {
    return "null";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  const stringValue = String(value);
  if (stringValue === "" || /[:{}\[\],&*#?|<>=!%@`]|^\s|\s$|\n/.test(stringValue)) {
    return JSON.stringify(stringValue);
  }

  return stringValue;
}
