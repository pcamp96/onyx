import type { PlannerTodayResult, PlannerWeekResult } from "@/lib/core/types";
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
      selfAttendee: true,
      responseStatus: "accepted",
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
    {
      id: "task-2",
      source: "asana",
      sourceId: "task-2",
      area: "TLW",
      title: "Review TLW quote funnel notes",
      status: "open",
      dueDate: "2026-03-08T18:00:00.000Z",
      isOverdue: false,
      isBlocked: false,
      score: 76,
      rank: 2,
      reason: "TLW work matters next, but it should follow the top HTG pace task.",
      scoreBreakdown: {
        deadlineProximity: 14,
        writingPaceGap: 8,
        incomeImpact: 7,
        businessImpact: 13,
        urgency: 9,
        areaWeight: 11,
        overdueAdjustment: 0,
        calendarCapacityAdjustment: 2,
        sponsorRiskAdjustment: 0,
        blockedAdjustment: 0,
        createdWorkshopAdjustment: 0,
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
      prompt: "One thing I learned this week while working on The Laser Workshop: founder systems break when operating friction stays hidden.",
      hook: "Most of the useful lessons in The Laser Workshop came from friction, not momentum.",
    },
  ],
  generatedAt: "2026-03-07T14:05:00.000Z",
};

const sampleWeekResponse: PlannerWeekResult = {
  weekStart: "2026-03-02",
  weekEnd: "2026-03-08",
  summary: {
    articlesSubmittedThisWeek: 2,
    weeklyMinimum: 3,
    weeklyGoal: 5,
    remainingToMinimum: 1,
    remainingToGoal: 3,
    estimatedPaySoFar: 650,
  },
  primaryFocus: "How-To Geek output",
  rankedPriorities: [
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
    {
      id: "task-3",
      source: "asana",
      sourceId: "task-3",
      area: "CREATED_WORKSHOP",
      title: "Prep sponsor revision notes",
      status: "open",
      dueDate: "2026-03-09T16:00:00.000Z",
      isOverdue: false,
      isBlocked: false,
      sponsorRisk: true,
      score: 73,
      rank: 2,
      reason: "Created Workshop is elevated because a sponsor obligation is approaching.",
      scoreBreakdown: {
        deadlineProximity: 18,
        writingPaceGap: 0,
        incomeImpact: 6,
        businessImpact: 10,
        urgency: 12,
        areaWeight: 6,
        overdueAdjustment: 0,
        calendarCapacityAdjustment: 2,
        sponsorRiskAdjustment: 14,
        blockedAdjustment: 0,
        createdWorkshopAdjustment: 5,
      },
    },
  ],
  deadlineRisks: ["Sponsor obligation is approaching for Prep sponsor revision notes."],
  warnings: [
    "One article remains to hit the weekly minimum.",
    "Sponsor obligation is approaching for Prep sponsor revision notes.",
  ],
  contentPrompts: [
    {
      category: "Story",
      project: "Onyx",
      prompt: "A real story from this week in Onyx: refining the daily planning workflow changed how I think about founder-facing software.",
      hook: "The interesting part of building Onyx is how often the plan changes once the work starts.",
    },
  ],
  generatedAt: "2026-03-07T14:05:00.000Z",
};

const sampleCaptureRequest = {
  text: "Follow up with sponsor about revision deadline",
};

const sampleCaptureResponse = {
  id: "capture-1",
  userId: "user-1",
  text: "Follow up with sponsor about revision deadline",
  source: "api",
  status: "open",
  createdAt: "2026-03-07T14:10:00.000Z",
  createdBy: "user-1",
};

function buildServerDescription(appUrl: string) {
  const hostname = new URL(appUrl).hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "Local development origin from APP_URL. For Custom GPT actions, replace this with an externally reachable HTTPS origin or tunnel before importing the schema.";
  }

  return "Externally reachable origin from APP_URL. This should be the real HTTPS base URL that the Custom GPT can call.";
}

function buildSchemaComponents() {
  return {
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
        additionalProperties: false,
        required: ["error"],
        properties: {
          error: { type: "string", minLength: 1 },
          details: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
      PlannerSummary: {
        type: "object",
        additionalProperties: false,
        required: ["articlesSubmittedThisWeek", "weeklyMinimum", "weeklyGoal", "remainingToMinimum", "remainingToGoal"],
        properties: {
          articlesSubmittedThisWeek: { type: "integer", minimum: 0 },
          weeklyMinimum: { type: "integer", minimum: 0 },
          weeklyGoal: { type: "integer", minimum: 0 },
          remainingToMinimum: { type: "integer", minimum: 0 },
          remainingToGoal: { type: "integer", minimum: 0 },
          estimatedPaySoFar: { type: "number" },
        },
      },
      CalendarConstraint: {
        type: "object",
        additionalProperties: false,
        required: ["id", "source", "sourceId", "title", "start", "end", "allDay", "isBusy"],
        properties: {
          id: { type: "string", minLength: 1 },
          source: { type: "string", enum: ["calendar"] },
          sourceId: { type: "string", minLength: 1 },
          sourceUrl: { type: "string", format: "uri" },
          title: { type: "string", minLength: 1 },
          start: { type: "string", format: "date-time" },
          end: { type: "string", format: "date-time" },
          allDay: { type: "boolean" },
          isBusy: { type: "boolean" },
          calendarName: { type: "string" },
          organizerEmail: { type: "string", format: "email" },
          organizerName: { type: "string" },
          creatorEmail: { type: "string", format: "email" },
          selfAttendee: { type: "boolean" },
          responseStatus: {
            type: "string",
            enum: ["needsAction", "declined", "tentative", "accepted"],
          },
        },
      },
      ScoreBreakdown: {
        type: "object",
        additionalProperties: false,
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
        additionalProperties: false,
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
          project: { type: "string", minLength: 1 },
          prompt: { type: "string", minLength: 1 },
          hook: { type: "string", minLength: 1 },
        },
        description: "Optional publishing or build-in-public prompts derived from current priorities and pacing. Safe to render directly when present.",
      },
      RankedTask: {
        type: "object",
        additionalProperties: false,
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
          id: { type: "string", minLength: 1 },
          source: {
            type: "string",
            enum: ["asana", "todoist", "google-sheets"],
          },
          sourceId: { type: "string", minLength: 1 },
          sourceUrl: { type: "string", format: "uri" },
          area: { type: "string", enum: ["HTG", "TLW", "CREATED_WORKSHOP", "ADMIN"] },
          title: { type: "string", minLength: 1 },
          notes: { type: "string" },
          status: { type: "string", enum: ["open", "in_progress", "blocked", "done"] },
          dueDate: {
            oneOf: [
              { type: "string", format: "date" },
              { type: "string", format: "date-time" },
            ],
          },
          priority: { type: "number" },
          estimatedEffort: { type: "number" },
          tags: {
            type: "array",
            items: { type: "string", minLength: 1 },
          },
          isOverdue: { type: "boolean" },
          isBlocked: { type: "boolean" },
          businessImpact: { type: "number" },
          incomeImpact: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          sponsorRisk: { type: "boolean" },
          projectName: { type: "string" },
          projectId: { type: "string" },
          score: { type: "number" },
          rank: { type: "integer", minimum: 1 },
          reason: { type: "string", minLength: 1 },
          scoreBreakdown: { $ref: "#/components/schemas/ScoreBreakdown" },
        },
      },
      TodayPlanResponse: {
        type: "object",
        additionalProperties: false,
        required: ["date", "summary", "calendarConstraints", "primaryFocus", "rankedTasks", "warnings", "generatedAt"],
        properties: {
          date: { type: "string", format: "date" },
          summary: { $ref: "#/components/schemas/PlannerSummary" },
          calendarConstraints: {
            type: "array",
            items: { $ref: "#/components/schemas/CalendarConstraint" },
          },
          primaryFocus: { type: "string", minLength: 1 },
          rankedTasks: {
            type: "array",
            items: { $ref: "#/components/schemas/RankedTask" },
          },
          warnings: {
            type: "array",
            items: { type: "string", minLength: 1 },
          },
          contentPrompts: {
            type: "array",
            items: { $ref: "#/components/schemas/ContentPrompt" },
          },
          generatedAt: { type: "string", format: "date-time" },
        },
      },
      WeekPlanResponse: {
        type: "object",
        additionalProperties: false,
        required: [
          "weekStart",
          "weekEnd",
          "summary",
          "primaryFocus",
          "rankedPriorities",
          "deadlineRisks",
          "warnings",
          "generatedAt",
        ],
        properties: {
          weekStart: { type: "string", format: "date" },
          weekEnd: { type: "string", format: "date" },
          summary: { $ref: "#/components/schemas/PlannerSummary" },
          primaryFocus: { type: "string", minLength: 1 },
          rankedPriorities: {
            type: "array",
            items: { $ref: "#/components/schemas/RankedTask" },
          },
          deadlineRisks: {
            type: "array",
            items: { type: "string", minLength: 1 },
          },
          warnings: {
            type: "array",
            items: { type: "string", minLength: 1 },
          },
          contentPrompts: {
            type: "array",
            items: { $ref: "#/components/schemas/ContentPrompt" },
          },
          generatedAt: { type: "string", format: "date-time" },
        },
      },
      CaptureItemRequest: {
        type: "object",
        additionalProperties: false,
        required: ["text"],
        properties: {
          text: {
            type: "string",
            minLength: 1,
            description: "Task, reminder, or idea to save into Onyx.",
          },
        },
      },
      CapturedItemResponse: {
        type: "object",
        additionalProperties: false,
        required: ["id", "userId", "text", "source", "status", "createdAt", "createdBy"],
        properties: {
          id: { type: "string", minLength: 1 },
          userId: { type: "string", minLength: 1 },
          text: { type: "string", minLength: 1 },
          source: { type: "string", enum: ["manual", "api", "future-plugin"] },
          status: { type: "string", enum: ["open", "processed"] },
          createdAt: { type: "string", format: "date-time" },
          createdBy: { type: "string", minLength: 1 },
        },
      },
    },
  };
}

export function buildCanonicalOpenApiSpec() {
  const { APP_URL } = getServerEnv();
  const baseUrl = APP_URL.replace(/\/$/, "");

  return {
    openapi: "3.1.0",
    info: {
      title: "Onyx Founder API",
      version: "1.1.0",
      description:
        "Canonical Onyx Custom GPT action schema for ranked founder priorities, weekly pacing, and explicit capture. Set APP_URL to the externally reachable origin for the deployment that the GPT should call.",
    },
    servers: [
      {
        url: baseUrl,
        description: buildServerDescription(baseUrl),
      },
    ],
    security: [{ OnyxApiKey: [] }],
    paths: {
      "/api/founder/today": {
        get: {
          operationId: "getFounderDailyPriorities",
          summary: "Get today's ranked execution priorities",
          description:
            "Call this when the user asks what to do today or what should happen first. Preserve rankedTasks order exactly. Treat calendarConstraints as execution limits, not as the planner. Use contentPrompts only for content-related requests when they are present.",
          security: [{ OnyxApiKey: [] }],
          responses: {
            "200": {
              description: "Today's ranked founder priorities and pacing signals.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TodayPlanResponse" },
                  examples: {
                    todayPlan: {
                      summary: "Sample /today response",
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
                  examples: {
                    unauthorized: {
                      value: { error: "Unauthorized" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/founder/week": {
        get: {
          operationId: "getFounderWeeklyOverview",
          summary: "Get this week's ranked priorities and pace overview",
          description:
            "Call this when the user asks about weekly priorities, pace, bottlenecks, or deadline risk. Preserve rankedPriorities order exactly. Highlight warnings and deadlineRisks clearly. Do not call this for simple capture requests.",
          security: [{ OnyxApiKey: [] }],
          responses: {
            "200": {
              description: "Weekly priority ordering, pace summary, and deadline risks.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/WeekPlanResponse" },
                  examples: {
                    weekPlan: {
                      summary: "Sample /week response",
                      value: sampleWeekResponse,
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
                  examples: {
                    unauthorized: {
                      value: { error: "Unauthorized" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/founder/capture": {
        post: {
          operationId: "captureFounderInboxItem",
          summary: "Save a task, idea, or reminder into Onyx",
          description:
            "Call this only when the user explicitly wants to save something into Onyx. Do not call it for read-only planning questions, summaries, or prioritization. Capture only the user's requested item text.",
          security: [{ OnyxApiKey: [] }],
          "x-openai-isConsequential": true,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CaptureItemRequest" },
                examples: {
                  captureRequest: {
                    summary: "Sample capture request",
                    value: sampleCaptureRequest,
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Captured item saved.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CapturedItemResponse" },
                  examples: {
                    capturedItem: {
                      summary: "Sample capture response",
                      value: sampleCaptureResponse,
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid capture payload.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  examples: {
                    missingText: {
                      value: { error: "Text is required" },
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
                  examples: {
                    unauthorized: {
                      value: { error: "Unauthorized" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: buildSchemaComponents(),
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
        const formattedKey = formatKey(key);
        if (isScalar(entry)) {
          return `${prefix}${formattedKey}: ${formatScalar(entry)}`;
        }

        if (Array.isArray(entry) && entry.length === 0) {
          return `${prefix}${formattedKey}: []`;
        }

        const nested = toYaml(entry, indent + 1);
        return `${prefix}${formattedKey}:\n${nested}`;
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

function formatKey(key: string) {
  if (/^\d+$/.test(key) || /[:{}\[\],&*#?|<>=!%@`]/.test(key) || /^\s|\s$/.test(key)) {
    return JSON.stringify(key);
  }

  return key;
}
