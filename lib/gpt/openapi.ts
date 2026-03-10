import type {
  PlannerIdeasApiResult,
  PlannerTodayApiResult,
  PlannerWeekApiResult,
  TlwAnalyticsResponse,
  TlwOverviewResponse,
  TlwSnapshotResponse,
} from "@/lib/core/types";
import { getServerEnv } from "@/lib/config/env";

const sampleTodayResponse: PlannerTodayApiResult = {
  date: "2026-03-07",
  timezone: "America/Chicago",
  summary: {
    articlesSubmittedThisWeek: 2,
    weeklyMinimum: 3,
    weeklyGoal: 5,
    remainingToMinimum: 1,
    remainingToGoal: 3,
    estimatedPaySoFar: 650,
  },
  pace: {
    status: "due_today",
    weeklyMinimum: 3,
    workdaysInWeek: 5,
    workdaysElapsedBeforeToday: 4,
    dailyMinimumRate: 0.6,
    targetByEndOfToday: 3,
    submittedThisWeek: 2,
    behindBeforeToday: 0,
    neededTodayToStayOnPace: 1,
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
      localDateLabel: "Sat, Mar 7",
      localTimeRangeLabel: "9:00 AM-9:30 AM",
    },
  ],
  primaryFocus: "How-To Geek output",
  approvedHtgTasks: [
    {
      id: "task-htg-1",
      source: "asana",
      sourceId: "task-htg-1",
      sourceUrl: "https://app.asana.com/0/123",
      area: "HTG",
      title: "Draft Chromebook roundup",
      status: "open",
      dueDate: "2026-03-07",
      dueLabel: "Sat, Mar 7",
      isDateOnlyDue: true,
      isOverdue: false,
      isBlocked: false,
      rank: 1,
      reason: "Writing progress today keeps the weekly minimum on pace.",
    },
    {
      source: "asana",
      sourceId: "task-htg-2",
      id: "task-htg-2",
      area: "HTG",
      title: "Finalize DTF explainer",
      status: "open",
      dueDate: "2026-03-08",
      dueLabel: "Sun, Mar 8",
      isDateOnlyDue: true,
      isOverdue: false,
      isBlocked: false,
      rank: 2,
      reason: "Writing progress today keeps the weekly minimum on pace.",
    },
  ],
  approvedHtgRemainingCount: 1,
  priorityTasks: [
    {
      id: "task-2",
      source: "todoist",
      sourceId: "task-2",
      area: "ADMIN",
      title: "Email editor back",
      status: "open",
      dueDate: "2026-03-07",
      dueLabel: "Sat, Mar 7",
      isDateOnlyDue: true,
      isOverdue: true,
      isBlocked: false,
      rank: 3,
      reason: "This task is overdue.",
    },
  ],
  otherTasks: [
    {
      id: "task-3",
      source: "todoist",
      sourceId: "task-3",
      area: "TLW",
      title: "Review TLW quote funnel notes",
      status: "open",
      dueDate: "2026-03-08T20:00:00.000Z",
      dueLabel: "Sun, Mar 8, 2:00 PM",
      isDateOnlyDue: false,
      isOverdue: false,
      isBlocked: false,
      rank: 4,
      reason: "This has the strongest execution value right now.",
    },
  ],
  tomorrowTasks: [
    {
      id: "task-4",
      source: "todoist",
      sourceId: "task-4",
      area: "TLW",
      title: "Review new quote funnel experiment",
      status: "open",
      dueDate: "2026-03-08",
      dueLabel: "Sun, Mar 8",
      isDateOnlyDue: true,
      isOverdue: false,
      isBlocked: false,
      rank: 5,
      reason: "This is due tomorrow and should be planned for next.",
    },
  ],
  otherTasksRemainingCount: 2,
  otherTasksRemainingByArea: {
    TLW: 1,
    ADMIN: 1,
  },
  warnings: ["HTG minimum pace needs 1 article(s) today to stay on track."],
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
  tlwOperatorPlan: {
    focus: "Seed",
    reason: "settings_velocity_7d = 0 -> platform content stalled.",
    metrics: {
      usersTotal: 364,
      newUsers7d: 7,
      paidUsers: 14,
      trialUsers: 19,
      settingsTotal: 26,
      newSettings7d: 0,
      settingsVelocity7d: 0,
      settingsPerPaidUser: 1.86,
      activationRate: 0.27,
      activationEstimate: 0.23,
      topChannel: "threads.net",
      growthStage: "seed",
      generatedAt: "2026-03-08T01:44:53.068Z",
    },
    topTasks: [
      {
        title: "Add 10-15 material settings today",
        reason: "Settings total is 26 and new settings in the last 7 days is 0. Supply is the main bottleneck.",
      },
      {
        title: "Upload 3-5 simple projects or quick wins",
        reason: "You have 364 users but only 26 settings. The product needs visible proof of life when new users land.",
      },
      {
        title: "Capture content while testing settings",
        reason: "One shop session can produce short clips, comparisons, failed attempts, and build-in-public updates without extra planning overhead.",
      },
    ],
    marketingAction: {
      title: "Post a Threads build-in-public update",
      draft: "Spent today dialing in new laser material settings for The Laser Workshop.\n\nEvery test gets uploaded to the database so new laser owners do not have to waste material figuring it out.\n\n26 settings live so far.\nGoal: 100+.\n\nSlowly turning this into the place you check before you hit Start.",
      reason: "threads.net is the current top channel, so use today's work to create one concrete post instead of a vague marketing task.",
    },
    quickRead: [
      "User growth exists (7 new users this week), but the supply side needs more depth.",
      "Settings velocity is effectively zero, which makes supply the biggest current bottleneck.",
      "Top channel: threads.net. Activation rate: 27%.",
    ],
  },
  generatedAt: "2026-03-07T14:05:00.000Z",
};

const sampleWeekResponse: PlannerWeekApiResult = {
  weekStart: "2026-03-02",
  weekEnd: "2026-03-08",
  timezone: "America/Chicago",
  summary: {
    articlesSubmittedThisWeek: 2,
    weeklyMinimum: 3,
    weeklyGoal: 5,
    remainingToMinimum: 1,
    remainingToGoal: 3,
    estimatedPaySoFar: 650,
  },
  pace: {
    status: "due_today",
    weeklyMinimum: 3,
    workdaysInWeek: 5,
    workdaysElapsedBeforeToday: 4,
    dailyMinimumRate: 0.6,
    targetByEndOfToday: 3,
    submittedThisWeek: 2,
    behindBeforeToday: 0,
    neededTodayToStayOnPace: 1,
  },
  primaryFocus: "How-To Geek output",
  approvedHtgTasks: [
    {
      id: "task-htg-1",
      source: "asana",
      sourceId: "task-htg-1",
      sourceUrl: "https://app.asana.com/0/123",
      area: "HTG",
      title: "Draft Chromebook roundup",
      status: "open",
      dueDate: "2026-03-07",
      dueLabel: "Sat, Mar 7",
      isDateOnlyDue: true,
      isOverdue: false,
      isBlocked: false,
      rank: 1,
      reason: "Writing progress today keeps the weekly minimum on pace.",
    },
  ],
  otherPriorities: [
    {
      id: "task-3",
      source: "asana",
      sourceId: "task-3",
      area: "CREATED_WORKSHOP",
      title: "Prep sponsor revision notes",
      status: "open",
      dueDate: "2026-03-09T16:00:00.000Z",
      dueLabel: "Mon, Mar 9, 10:00 AM",
      isDateOnlyDue: false,
      isOverdue: false,
      isBlocked: false,
      rank: 2,
      reason: "Sponsor risk raises urgency. The deadline is close.",
    },
  ],
  rankedPriorities: [
    {
      id: "task-3",
      source: "asana",
      sourceId: "task-3",
      area: "CREATED_WORKSHOP",
      title: "Prep sponsor revision notes",
      status: "open",
      dueDate: "2026-03-09T16:00:00.000Z",
      dueLabel: "Mon, Mar 9, 10:00 AM",
      isDateOnlyDue: false,
      isOverdue: false,
      isBlocked: false,
      rank: 2,
      reason: "Sponsor risk raises urgency. The deadline is close.",
    },
  ],
  areaPriorities: {
    HTG: [
      {
        id: "task-htg-1",
        source: "asana",
        sourceId: "task-htg-1",
        sourceUrl: "https://app.asana.com/0/123",
        area: "HTG",
        title: "Draft Chromebook roundup",
        status: "open",
        dueDate: "2026-03-07",
        dueLabel: "Sat, Mar 7",
        isDateOnlyDue: true,
        isOverdue: false,
        isBlocked: false,
        rank: 1,
        reason: "Writing progress today keeps the weekly minimum on pace.",
      },
    ],
    TLW: [
      {
        id: "task-2",
        source: "todoist",
        sourceId: "task-2",
        sourceUrl: "https://app.todoist.com/app/task/456",
        area: "TLW",
        title: "Review quote funnel friction notes",
        status: "open",
        dueDate: "2026-03-08",
        dueLabel: "Sun, Mar 8",
        isDateOnlyDue: true,
        isOverdue: false,
        isBlocked: false,
        rank: 4,
        reason: "TLW still needs steady product and marketing follow-through this week.",
      },
    ],
    CREATED_WORKSHOP: [
      {
        id: "task-3",
        source: "asana",
        sourceId: "task-3",
        area: "CREATED_WORKSHOP",
        title: "Prep sponsor revision notes",
        status: "open",
        dueDate: "2026-03-09T16:00:00.000Z",
        dueLabel: "Mon, Mar 9, 10:00 AM",
        isDateOnlyDue: false,
        isOverdue: false,
        isBlocked: false,
        rank: 2,
        reason: "Sponsor risk raises urgency. The deadline is close.",
      },
    ],
  },
  rankedPrioritiesRemainingCount: 4,
  rankedPrioritiesRemainingByArea: {
    HTG: 4,
  },
  deadlineRisks: ["Sponsor obligation is approaching for Prep sponsor revision notes."],
  warnings: [
    "HTG minimum pace needs 1 article(s) today to stay on track.",
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

const sampleIdeasResponse: PlannerIdeasApiResult = {
  summary: {
    articlesSubmittedThisWeek: 2,
    weeklyMinimum: 3,
    weeklyGoal: 5,
    remainingToMinimum: 1,
    remainingToGoal: 3,
    estimatedPaySoFar: 650,
  },
  primaryFocus: "How-To Geek output",
  contentPrompts: [
    {
      category: "Problem/Solution",
      project: "The Laser Workshop",
      prompt: "I keep seeing the same problem in The Laser Workshop: quoting friction slows the feedback loop. My current fix is showing the exact place where interest turns into drop-off.",
      hook: "A lot of product direction gets clearer once the underlying bottleneck is obvious.",
    },
    {
      category: "Curiosity/question",
      project: "Onyx",
      prompt: "Question I'm exploring in Onyx: how much of daily planning should be visible to the founder? Right now I suspect the answer is more than most tools show.",
      hook: "I learn faster when I publish the open question before I have the polished answer.",
    },
    {
      category: "Build in public",
      project: "Created Workshop",
      prompt: "Today I pushed sponsor-facing workshop work higher only when the deadline pressure was real. The hard part was deciding when urgency is signal instead of noise.",
      hook: "Building Created Workshop is forcing me to make real tradeoffs instead of collecting ideas.",
    },
  ],
  warnings: ["One article remains to hit the weekly minimum."],
  rankedContext: sampleWeekResponse.rankedPriorities,
  rankedContextRemainingCount: 0,
  rankedContextRemainingByArea: {},
  generatedAt: "2026-03-07T14:05:00.000Z",
};

const sampleTlwSnapshotResponse: TlwSnapshotResponse = {
  users_total: 364,
  new_users_24h: 2,
  new_users_7d: 11,
  paid_users: 14,
  trial_users: 19,
  settings_total: 26,
  new_settings_7d: 5,
  users_delta_7d: 11,
  settings_delta_7d: 5,
  paid_users_delta_7d: 2,
  settings_velocity_7d: 0.71,
  settings_per_paid_user: 1.86,
  user_growth_rate_7d: 3.1,
  settings_growth_rate_7d: 5.4,
  growth_stage: "seed",
  user_tiers: {
    free: 331,
    maker: 18,
    merchant: 10,
    manufacturer: 5,
  },
  settings_breakdown: {
    community_settings: 18,
    supplier_settings: 8,
  },
  traffic_sources: {
    referrers: [
      { name: "threads.net", visits: 41, share: 0.34 },
      { name: "google", visits: 38, share: 0.31 },
    ],
  },
  activation_rate: 0.27,
  generated_at: "2026-03-08T01:44:53.033Z",
};

const sampleTlwAnalyticsResponse: TlwAnalyticsResponse = {
  traffic_sources: {
    referrers: [
      { name: "threads.net", visits: 41, share: 0.34 },
      { name: "google", visits: 38, share: 0.31 },
    ],
  },
  activation_rate: 0.27,
  activation_estimate: 0.23,
  top_channel: "threads.net",
  window_days: 7,
  generated_at: "2026-03-08T01:44:53.068Z",
};

const sampleTlwOverviewResponse: TlwOverviewResponse = {
  snapshot: sampleTlwSnapshotResponse,
  analytics: sampleTlwAnalyticsResponse,
  generated_at: "2026-03-08T01:44:53.068Z",
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
        name: "Authorization",
        description:
          "Per-user Onyx GPT API key generated from the GPT Setup page. Send the token in the Authorization header. Bearer <token> is supported.",
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
      PlannerPace: {
        type: "object",
        additionalProperties: false,
        required: [
          "status",
          "weeklyMinimum",
          "workdaysInWeek",
          "workdaysElapsedBeforeToday",
          "dailyMinimumRate",
          "targetByEndOfToday",
          "submittedThisWeek",
          "behindBeforeToday",
          "neededTodayToStayOnPace",
        ],
        properties: {
          status: { type: "string", enum: ["behind", "due_today", "on_track"] },
          weeklyMinimum: { type: "integer", minimum: 0 },
          workdaysInWeek: { type: "integer", minimum: 1 },
          workdaysElapsedBeforeToday: { type: "integer", minimum: 0 },
          dailyMinimumRate: { type: "number", minimum: 0 },
          targetByEndOfToday: { type: "number", minimum: 0 },
          submittedThisWeek: { type: "integer", minimum: 0 },
          behindBeforeToday: { type: "number", minimum: 0 },
          neededTodayToStayOnPace: { type: "number", minimum: 0 },
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
          localDateLabel: { type: "string" },
          localTimeRangeLabel: { type: "string" },
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
      RankedTaskPreview: {
        type: "object",
        additionalProperties: false,
        required: ["id", "source", "sourceId", "area", "title", "status", "isOverdue", "isBlocked", "rank", "reason"],
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
          status: { type: "string", enum: ["open", "in_progress", "blocked", "done"] },
          dueDate: {
            oneOf: [
              { type: "string", format: "date" },
              { type: "string", format: "date-time" },
            ],
          },
          dueLabel: { type: "string" },
          isDateOnlyDue: { type: "boolean" },
          isOverdue: { type: "boolean" },
          isBlocked: { type: "boolean" },
          rank: { type: "integer", minimum: 1 },
          reason: { type: "string", minLength: 1 },
        },
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
        required: [
          "date",
          "timezone",
          "summary",
          "pace",
          "calendarConstraints",
          "primaryFocus",
          "approvedHtgTasks",
          "approvedHtgRemainingCount",
          "priorityTasks",
          "otherTasks",
          "tomorrowTasks",
          "warnings",
          "generatedAt",
        ],
        properties: {
          date: { type: "string", format: "date" },
          timezone: { type: "string", minLength: 1 },
          summary: { $ref: "#/components/schemas/PlannerSummary" },
          pace: { $ref: "#/components/schemas/PlannerPace" },
          calendarConstraints: {
            type: "array",
            items: { $ref: "#/components/schemas/CalendarConstraint" },
          },
          primaryFocus: { type: "string", minLength: 1 },
          approvedHtgTasks: {
            type: "array",
            items: { $ref: "#/components/schemas/RankedTaskPreview" },
          },
          approvedHtgRemainingCount: {
            type: "integer",
            minimum: 0,
          },
          priorityTasks: {
            type: "array",
            items: { $ref: "#/components/schemas/RankedTaskPreview" },
          },
          otherTasks: {
            type: "array",
            items: { $ref: "#/components/schemas/RankedTaskPreview" },
          },
          tomorrowTasks: {
            type: "array",
            items: { $ref: "#/components/schemas/RankedTaskPreview" },
          },
          otherTasksRemainingCount: {
            type: "integer",
            minimum: 0,
          },
          otherTasksRemainingByArea: {
            type: "object",
            additionalProperties: false,
            properties: {
              HTG: { type: "integer", minimum: 0 },
              TLW: { type: "integer", minimum: 0 },
              CREATED_WORKSHOP: { type: "integer", minimum: 0 },
              ADMIN: { type: "integer", minimum: 0 },
            },
          },
          warnings: {
            type: "array",
            items: { type: "string", minLength: 1 },
          },
          contentPrompts: {
            type: "array",
            items: { $ref: "#/components/schemas/ContentPrompt" },
          },
          tlwOperatorPlan: { $ref: "#/components/schemas/TlwOperatorPlan" },
          generatedAt: { type: "string", format: "date-time" },
        },
      },
      WeekPlanResponse: {
        type: "object",
        additionalProperties: false,
        required: [
          "weekStart",
          "weekEnd",
          "timezone",
          "summary",
          "pace",
          "primaryFocus",
          "approvedHtgTasks",
          "otherPriorities",
          "rankedPriorities",
          "areaPriorities",
          "rankedPrioritiesRemainingCount",
          "deadlineRisks",
          "warnings",
          "generatedAt",
        ],
        properties: {
          weekStart: { type: "string", format: "date" },
          weekEnd: { type: "string", format: "date" },
          timezone: { type: "string", minLength: 1 },
          summary: { $ref: "#/components/schemas/PlannerSummary" },
          pace: { $ref: "#/components/schemas/PlannerPace" },
          primaryFocus: { type: "string", minLength: 1 },
          approvedHtgTasks: {
            type: "array",
            items: { $ref: "#/components/schemas/RankedTaskPreview" },
          },
          otherPriorities: {
            type: "array",
            items: { $ref: "#/components/schemas/RankedTaskPreview" },
          },
          rankedPriorities: {
            type: "array",
            items: { $ref: "#/components/schemas/RankedTaskPreview" },
          },
          areaPriorities: {
            type: "object",
            additionalProperties: false,
            required: ["HTG", "TLW", "CREATED_WORKSHOP"],
            properties: {
              HTG: {
                type: "array",
                items: { $ref: "#/components/schemas/RankedTaskPreview" },
              },
              TLW: {
                type: "array",
                items: { $ref: "#/components/schemas/RankedTaskPreview" },
              },
              CREATED_WORKSHOP: {
                type: "array",
                items: { $ref: "#/components/schemas/RankedTaskPreview" },
              },
            },
          },
          rankedPrioritiesRemainingCount: {
            type: "integer",
            minimum: 0,
          },
          rankedPrioritiesRemainingByArea: {
            type: "object",
            additionalProperties: false,
            properties: {
              HTG: { type: "integer", minimum: 0 },
              TLW: { type: "integer", minimum: 0 },
              CREATED_WORKSHOP: { type: "integer", minimum: 0 },
              ADMIN: { type: "integer", minimum: 0 },
            },
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
      IdeasPlanResponse: {
        type: "object",
        additionalProperties: false,
        required: ["summary", "primaryFocus", "contentPrompts", "warnings", "rankedContext", "rankedContextRemainingCount", "generatedAt"],
        properties: {
          summary: { $ref: "#/components/schemas/PlannerSummary" },
          primaryFocus: { type: "string", minLength: 1 },
          contentPrompts: {
            type: "array",
            items: { $ref: "#/components/schemas/ContentPrompt" },
          },
          warnings: {
            type: "array",
            items: { type: "string", minLength: 1 },
          },
          rankedContext: {
            type: "array",
            items: { $ref: "#/components/schemas/RankedTaskPreview" },
          },
          rankedContextRemainingCount: {
            type: "integer",
            minimum: 0,
          },
          rankedContextRemainingByArea: {
            type: "object",
            additionalProperties: false,
            properties: {
              HTG: { type: "integer", minimum: 0 },
              TLW: { type: "integer", minimum: 0 },
              CREATED_WORKSHOP: { type: "integer", minimum: 0 },
              ADMIN: { type: "integer", minimum: 0 },
            },
          },
          generatedAt: { type: "string", format: "date-time" },
        },
      },
      TlwReferrer: {
        type: "object",
        additionalProperties: false,
        required: ["name", "visits"],
        properties: {
          name: { type: "string", minLength: 1 },
          visits: { type: "integer", minimum: 0 },
          share: { type: "number" },
        },
      },
      TlwTrafficSources: {
        type: "object",
        additionalProperties: false,
        required: ["referrers"],
        properties: {
          referrers: {
            type: "array",
            items: { $ref: "#/components/schemas/TlwReferrer" },
          },
        },
      },
      TlwUserTiers: {
        type: "object",
        additionalProperties: false,
        properties: {
          free: { type: "integer", minimum: 0 },
          maker: { type: "integer", minimum: 0 },
          merchant: { type: "integer", minimum: 0 },
          manufacturer: { type: "integer", minimum: 0 },
        },
      },
      TlwSettingsBreakdown: {
        type: "object",
        additionalProperties: false,
        properties: {
          community_settings: { type: "integer", minimum: 0 },
          supplier_settings: { type: "integer", minimum: 0 },
        },
      },
      TlwSnapshotResponse: {
        type: "object",
        additionalProperties: false,
        required: ["users_total", "settings_total", "generated_at"],
        properties: {
          users_total: { type: "integer", minimum: 0 },
          new_users_24h: { type: "integer" },
          new_users_7d: { type: "integer" },
          paid_users: { type: "integer" },
          trial_users: { type: "integer" },
          settings_total: { type: "integer", minimum: 0 },
          new_settings_7d: { type: "integer" },
          users_delta_7d: { type: "integer" },
          settings_delta_7d: { type: "integer" },
          paid_users_delta_7d: { type: "integer" },
          settings_velocity_7d: { type: "number" },
          settings_per_paid_user: { type: "number" },
          user_growth_rate_7d: { type: "number" },
          settings_growth_rate_7d: { type: "number" },
          growth_stage: {
            type: "string",
            enum: ["seed", "early-growth", "growth", "scale"],
          },
          user_tiers: { $ref: "#/components/schemas/TlwUserTiers" },
          settings_breakdown: { $ref: "#/components/schemas/TlwSettingsBreakdown" },
          traffic_sources: {
            nullable: true,
            oneOf: [
              { $ref: "#/components/schemas/TlwTrafficSources" },
              { type: "null" },
            ],
          },
          activation_rate: {
            nullable: true,
            oneOf: [{ type: "number" }, { type: "null" }],
          },
          generated_at: { type: "string", format: "date-time" },
        },
      },
      TlwAnalyticsResponse: {
        type: "object",
        additionalProperties: false,
        required: ["generated_at"],
        properties: {
          traffic_sources: {
            nullable: true,
            oneOf: [
              { $ref: "#/components/schemas/TlwTrafficSources" },
              { type: "null" },
            ],
          },
          activation_rate: {
            nullable: true,
            oneOf: [{ type: "number" }, { type: "null" }],
          },
          activation_estimate: {
            nullable: true,
            oneOf: [{ type: "number" }, { type: "null" }],
          },
          top_channel: {
            nullable: true,
            oneOf: [{ type: "string" }, { type: "null" }],
          },
          window_days: { type: "integer", minimum: 1, maximum: 90 },
          generated_at: { type: "string", format: "date-time" },
        },
      },
      TlwOverviewResponse: {
        type: "object",
        additionalProperties: false,
        required: ["snapshot", "analytics", "generated_at"],
        properties: {
          snapshot: { $ref: "#/components/schemas/TlwSnapshotResponse" },
          analytics: { $ref: "#/components/schemas/TlwAnalyticsResponse" },
          generated_at: { type: "string", format: "date-time" },
        },
      },
      TlwOperatorTask: {
        type: "object",
        additionalProperties: false,
        required: ["title", "reason"],
        properties: {
          title: { type: "string", minLength: 1 },
          reason: { type: "string", minLength: 1 },
        },
      },
      TlwOperatorMarketingAction: {
        type: "object",
        additionalProperties: false,
        required: ["title", "reason"],
        properties: {
          title: { type: "string", minLength: 1 },
          draft: { type: "string", minLength: 1 },
          reason: { type: "string", minLength: 1 },
        },
      },
      TlwOperatorMetrics: {
        type: "object",
        additionalProperties: false,
        required: ["usersTotal", "settingsTotal", "generatedAt"],
        properties: {
          usersTotal: { type: "integer", minimum: 0 },
          newUsers7d: { type: "integer" },
          paidUsers: { type: "integer" },
          trialUsers: { type: "integer" },
          settingsTotal: { type: "integer", minimum: 0 },
          newSettings7d: { type: "integer" },
          settingsVelocity7d: { type: "number" },
          settingsPerPaidUser: { type: "number" },
          activationRate: {
            nullable: true,
            oneOf: [{ type: "number" }, { type: "null" }],
          },
          activationEstimate: {
            nullable: true,
            oneOf: [{ type: "number" }, { type: "null" }],
          },
          topChannel: {
            nullable: true,
            oneOf: [{ type: "string" }, { type: "null" }],
          },
          growthStage: {
            type: "string",
            enum: ["seed", "early-growth", "growth", "scale"],
          },
          generatedAt: { type: "string", format: "date-time" },
        },
      },
      TlwOperatorPlan: {
        type: "object",
        additionalProperties: false,
        required: ["focus", "reason", "metrics", "topTasks", "marketingAction", "quickRead"],
        properties: {
          focus: {
            type: "string",
            enum: ["Seed", "Push", "Double Down", "Fix"],
          },
          reason: { type: "string", minLength: 1 },
          metrics: { $ref: "#/components/schemas/TlwOperatorMetrics" },
          topTasks: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/TlwOperatorTask" },
          },
          marketingAction: { $ref: "#/components/schemas/TlwOperatorMarketingAction" },
          quickRead: {
            type: "array",
            minItems: 1,
            items: { type: "string", minLength: 1 },
          },
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
            "Call this when the user asks what to do today or what should happen first. Use approvedHtgTasks for the dedicated HTG approved-article section, otherTasks for the rest of the actionable load, pace for minimum-output status, and calendarConstraints.localTimeRangeLabel for meeting times. Treat calendar constraints as execution limits, not as the planner.",
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
      "/api/founder/ideas": {
        get: {
          operationId: "getFounderContentIdeas",
          summary: "Get current posting and build-in-public ideas",
          description:
            "Call this when the user explicitly asks for post ideas, content angles, or build-in-public prompts tied to current work. Use the returned contentPrompts directly instead of inventing unsupported ideas.",
          security: [{ OnyxApiKey: [] }],
          responses: {
            "200": {
              description: "Current content ideas derived from active priorities, warnings, and pace.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/IdeasPlanResponse" },
                  examples: {
                    ideasPlan: {
                      summary: "Sample /ideas response",
                      value: sampleIdeasResponse,
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
            "Call this when the user asks about weekly priorities, pace, bottlenecks, or deadline risk. Use approvedHtgTasks for HTG approved articles due this week, otherPriorities for the rest of the weekly workload, and pace for day-based minimum output status. Preserve returned order exactly.",
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
      "/api/founder/tlw/snapshot": {
        get: {
          operationId: "getFounderTlwSnapshot",
          summary: "Get The Laser Workshop product metrics snapshot",
          description:
            "Call this when the user explicitly wants the raw TLW product snapshot without the analytics layer. Use it for direct counts, growth stage, user tiers, and settings breakdown.",
          security: [{ OnyxApiKey: [] }],
          responses: {
            "200": {
              description: "TLW product metrics snapshot.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TlwSnapshotResponse" },
                  examples: {
                    tlwSnapshot: {
                      summary: "Sample TLW snapshot response",
                      value: sampleTlwSnapshotResponse,
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
      "/api/founder/tlw/analytics": {
        get: {
          operationId: "getFounderTlwAnalytics",
          summary: "Get The Laser Workshop traffic analytics",
          description:
            "Call this when the user asks specifically about TLW traffic sources, top channel, or activation metrics. Use window_days only when the user asks for a wider or narrower view.",
          security: [{ OnyxApiKey: [] }],
          parameters: [
            {
              name: "window_days",
              in: "query",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 90,
                default: 7,
              },
            },
          ],
          responses: {
            "200": {
              description: "TLW traffic and activation analytics.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TlwAnalyticsResponse" },
                  examples: {
                    tlwAnalytics: {
                      summary: "Sample TLW analytics response",
                      value: sampleTlwAnalyticsResponse,
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
      "/api/founder/tlw/overview": {
        get: {
          operationId: "getFounderTlwOverview",
          summary: "Get merged TLW snapshot and analytics",
          description:
            "Call this when the user asks how TLW is doing, what the biggest growth bottleneck is, or what marketing action to prioritize from real TLW metrics. Use it as the default TLW metrics call.",
          security: [{ OnyxApiKey: [] }],
          parameters: [
            {
              name: "window_days",
              in: "query",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 90,
                default: 7,
              },
            },
          ],
          responses: {
            "200": {
              description: "Merged TLW product snapshot and analytics.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TlwOverviewResponse" },
                  examples: {
                    tlwOverview: {
                      summary: "Sample TLW overview response",
                      value: sampleTlwOverviewResponse,
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
