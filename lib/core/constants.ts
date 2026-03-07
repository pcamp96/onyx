import type { IntegrationProvider, PlannerSettings, WorkArea } from "@/lib/core/types";

export const SESSION_COOKIE_NAME = "onyx_session";
export const FOUNDER_USER_ID = "founder";

export const PROVIDERS: IntegrationProvider[] = [
  "asana",
  "todoist",
  "google-sheets",
  "google-calendar",
  "apple-calendar",
];

export const DEFAULT_AREA_WEIGHTS: Record<WorkArea, number> = {
  HTG: 40,
  TLW: 28,
  CREATED_WORKSHOP: 12,
  ADMIN: 4,
};

export const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  userId: FOUNDER_USER_ID,
  weeklyArticleMinimum: 11,
  weeklyArticleGoal: 15,
  createdWorkshopLowPriorityEnabled: true,
  sponsorUrgencyDays: 10,
  maxTodayTasks: 7,
  timezone: "America/Chicago",
  workdays: [1, 2, 3, 4, 5, 6],
  sundayNoWork: true,
  calendarEventHandling: "all_busy",
  calendarOwnerIdentifiers: [],
  areaWeights: DEFAULT_AREA_WEIGHTS,
  createdAt: "",
  updatedAt: "",
  updatedBy: FOUNDER_USER_ID,
};

export const PROVIDER_LABELS: Record<IntegrationProvider, string> = {
  asana: "Asana",
  todoist: "Todoist",
  "google-sheets": "Google Sheets",
  "google-calendar": "Google Calendar",
  "apple-calendar": "Apple Calendar",
};
