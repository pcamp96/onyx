export type WorkArea = "HTG" | "TLW" | "CREATED_WORKSHOP" | "ADMIN";
export type IntegrationProvider =
  | "asana"
  | "todoist"
  | "google-sheets"
  | "calendar";

export interface AuditFields {
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface PlannerSettings extends AuditFields {
  userId: string;
  weeklyArticleMinimum: number;
  weeklyArticleGoal: number;
  createdWorkshopLowPriorityEnabled: boolean;
  sponsorUrgencyDays: number;
  maxTodayTasks: number;
  timezone: string;
  workdays: number[];
  sundayNoWork: boolean;
  calendarEventHandling: "all_busy" | "owned_only";
  calendarOwnerIdentifiers: string[];
  areaWeights: Record<WorkArea, number>;
}

export interface IntegrationRecord {
  userId: string;
  provider: IntegrationProvider;
  enabled: boolean;
  status: "idle" | "connected" | "error" | "disabled";
  configRef?: string;
  secretRef?: string;
  lastSyncAt?: string;
  lastSyncStatus?: "success" | "error";
  lastError?: string;
  lastTestAt?: string;
  lastTestStatus?: "success" | "error";
  updatedAt: string;
  updatedBy: string;
}

export interface EncryptedSecretRecord {
  userId: string;
  provider: IntegrationProvider;
  ciphertext: string;
  iv: string;
  authTag: string;
  keyId: string;
  algorithm: string;
  version: string;
  updatedAt: string;
  updatedBy: string;
}

export interface IntegrationConfigRecord extends AuditFields {
  userId: string;
  provider: IntegrationProvider;
  values: Record<string, unknown>;
}

export interface GoogleSheetColumnMapping {
  submitted_at: string;
  title: string;
  source_url?: string;
  word_count?: string;
  pay?: string;
  status?: string;
  outlet?: string;
}

export type GoogleSheetLayout = "table" | "weekly_grid";

export interface GoogleSheetConfig {
  spreadsheetId: string;
  worksheetName: string;
  worksheetNames?: string[];
  sourceUrl?: string;
  layout?: GoogleSheetLayout;
  headerRow?: number;
  dataStartRow?: number;
  endRow?: number;
  weekStartDate?: string;
  columnMapping: GoogleSheetColumnMapping;
}

export interface SponsorProject {
  id: string;
  title: string;
  sponsorName?: string;
  status: "planned" | "active" | "blocked" | "done";
  deadline?: string;
  riskLevel: "low" | "medium" | "high";
  notes?: string;
  deliverables?: string[];
  updatedAt: string;
  updatedBy: string;
}

export interface CapturedItem {
  id: string;
  userId: string;
  text: string;
  source: "manual" | "api" | "future-plugin";
  status: "open" | "processed";
  createdAt: string;
  createdBy: string;
}

export interface PluginRegistryRecord {
  id: string;
  name: string;
  slug: string;
  version: string;
  enabled: boolean;
  source: string;
  capabilities: string[];
  manifest: Record<string, unknown>;
  installedAt: string;
  updatedAt: string;
}

export interface NormalizedTask {
  id: string;
  source: IntegrationProvider;
  sourceId: string;
  sourceUrl?: string;
  area: WorkArea;
  title: string;
  notes?: string;
  status: "open" | "in_progress" | "blocked" | "done";
  dueDate?: string;
  priority?: number;
  estimatedEffort?: number;
  tags?: string[];
  isOverdue: boolean;
  isBlocked: boolean;
  businessImpact?: number;
  incomeImpact?: number;
  createdAt?: string;
  updatedAt?: string;
  sponsorRisk?: boolean;
  projectName?: string;
  projectId?: string;
}

export interface NormalizedCalendarEvent {
  id: string;
  source: "calendar";
  sourceId: string;
  sourceUrl?: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  isBusy: boolean;
  calendarName?: string;
  organizerEmail?: string;
  organizerName?: string;
  creatorEmail?: string;
  selfAttendee?: boolean;
  responseStatus?: string;
}

export interface NormalizedArticleEntry {
  id: string;
  source: IntegrationProvider;
  sourceId: string;
  sourceUrl?: string;
  submittedAt: string;
  title: string;
  outlet?: string;
  wordCount?: number;
  pay?: number;
  status?: string;
  weekKey: string;
  monthKey: string;
}

export interface ScoreBreakdown {
  deadlineProximity: number;
  writingPaceGap: number;
  incomeImpact: number;
  businessImpact: number;
  urgency: number;
  areaWeight: number;
  overdueAdjustment: number;
  calendarCapacityAdjustment: number;
  sponsorRiskAdjustment: number;
  blockedAdjustment: number;
  createdWorkshopAdjustment: number;
}

export interface RankedTask extends NormalizedTask {
  score: number;
  rank: number;
  reason: string;
  scoreBreakdown: ScoreBreakdown;
}

export interface PlannerSummary {
  articlesSubmittedThisWeek: number;
  weeklyMinimum: number;
  weeklyGoal: number;
  remainingToMinimum: number;
  remainingToGoal: number;
  estimatedPaySoFar?: number;
}

export type ContentPromptCategory =
  | "Story"
  | "Opinion"
  | "Lesson"
  | "Behind the scenes"
  | "Build in public"
  | "Problem/Solution"
  | "Progress update"
  | "Curiosity/question"
  | "Vision"
  | "Founder reflection";

export type ContentPromptCommand = "today" | "week" | "ideas" | "stats";

export interface ContentPrompt {
  category: ContentPromptCategory;
  project: string;
  prompt: string;
  hook: string;
}

export interface PlannerTodayResult {
  date: string;
  summary: PlannerSummary;
  calendarConstraints: NormalizedCalendarEvent[];
  primaryFocus: string;
  rankedTasks: RankedTask[];
  warnings: string[];
  contentPrompts: ContentPrompt[];
  generatedAt?: string;
}

export interface PlannerWeekResult {
  weekStart: string;
  weekEnd: string;
  summary: PlannerSummary;
  primaryFocus: string;
  rankedPriorities: RankedTask[];
  deadlineRisks: string[];
  warnings: string[];
  contentPrompts: ContentPrompt[];
  generatedAt?: string;
}

export interface PlannerIdeasResult {
  summary: PlannerSummary;
  primaryFocus: string;
  contentPrompts: ContentPrompt[];
  warnings: string[];
  rankedContext: Pick<
    RankedTask,
    "id" | "source" | "sourceId" | "sourceUrl" | "area" | "title" | "status" | "dueDate" | "isOverdue" | "isBlocked" | "score" | "rank" | "reason" | "scoreBreakdown"
  >[];
  generatedAt?: string;
}

export interface PlanningSnapshot {
  id: string;
  type: "today" | "week";
  date: string;
  userId: string;
  summary: PlannerSummary;
  primaryFocus: string;
  calendarConstraints: Pick<
    NormalizedCalendarEvent,
    "id" | "source" | "sourceId" | "title" | "start" | "end" | "allDay" | "isBusy"
  >[];
  rankedTasks: Pick<
    RankedTask,
    "id" | "source" | "sourceId" | "sourceUrl" | "area" | "title" | "status" | "dueDate" | "isOverdue" | "isBlocked" | "score" | "rank" | "reason" | "scoreBreakdown"
  >[];
  warnings: string[];
  contentPrompts: ContentPrompt[];
  createdAt: string;
  generatedAt?: string;
}

export interface PlanningDebugRecord {
  id: "today" | "week";
  userId: string;
  type: "today" | "week";
  date: string;
  generatedAt: string;
  providerSummaries: Record<
    string,
    {
      taskCount: number;
      calendarEventCount: number;
      articleEntryCount: number;
      preview: Record<string, unknown>;
    }
  >;
  normalizedInputPreview: {
    tasks: Array<Pick<NormalizedTask, "id" | "source" | "sourceId" | "title" | "area" | "status" | "dueDate" | "isOverdue" | "isBlocked">>;
    calendarEvents: Array<Pick<NormalizedCalendarEvent, "id" | "source" | "sourceId" | "title" | "start" | "end" | "allDay" | "isBusy">>;
    articleEntries: Array<Pick<NormalizedArticleEntry, "id" | "source" | "sourceId" | "title" | "submittedAt" | "weekKey" | "monthKey">>;
  };
}
