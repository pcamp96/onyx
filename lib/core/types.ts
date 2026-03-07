export type WorkArea = "HTG" | "TLW" | "CREATED_WORKSHOP" | "ADMIN";
export type IntegrationProvider =
  | "asana"
  | "todoist"
  | "google-sheets"
  | "google-calendar"
  | "apple-calendar";

export interface AuditFields {
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  role: "admin";
  status: "active" | "disabled";
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
  areaWeights: Record<WorkArea, number>;
}

export interface IntegrationRecord {
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

export interface GoogleSheetColumnMapping {
  submitted_at: string;
  title: string;
  word_count?: string;
  pay?: string;
  status?: string;
  outlet?: string;
}

export interface GoogleSheetConfig {
  userId: string;
  spreadsheetId: string;
  worksheetName: string;
  sourceUrl?: string;
  columnMapping: GoogleSheetColumnMapping;
  updatedAt: string;
  updatedBy: string;
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
  sourceId: string;
  provider: IntegrationProvider;
  area: WorkArea;
  title: string;
  notes?: string;
  status: "open" | "in_progress" | "blocked" | "done";
  dueAt?: string;
  isOverdue: boolean;
  priority?: number;
  projectName?: string;
  projectId?: string;
  labels?: string[];
  estimatedValue?: number;
  incomeImpact?: number;
  businessImpact?: number;
  sponsorRisk?: boolean;
  blockerIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface NormalizedCalendarEvent {
  id: string;
  provider: "google-calendar" | "apple-calendar";
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NormalizedArticleEntry {
  id: string;
  title: string;
  submittedAt: string;
  outlet?: string;
  status?: string;
  wordCount?: number;
  pay?: number;
  metadata?: Record<string, unknown>;
}

export interface RankedTask extends NormalizedTask {
  score: number;
  rank: number;
  reason: string;
  scoreBreakdown: {
    deadline: number;
    weeklyPace: number;
    incomeImpact: number;
    businessImpact: number;
    blockerPenalty: number;
    urgency: number;
    areaWeight: number;
    calendarCapacityAdjustment: number;
    overdueBoost: number;
    sponsorRiskBoost: number;
  };
}

export interface PlannerSummary {
  articlesSubmittedThisWeek: number;
  weeklyMinimum: number;
  weeklyGoal: number;
  remainingToMinimum: number;
  remainingToGoal: number;
  estimatedPaySoFar?: number;
}

export interface PlannerTodayResult {
  date: string;
  summary: PlannerSummary;
  calendarConstraints: NormalizedCalendarEvent[];
  primaryFocus: string;
  rankedTasks: RankedTask[];
  warnings: string[];
}

export interface PlannerWeekResult {
  weekStart: string;
  weekEnd: string;
  summary: PlannerSummary;
  rankedPriorities: RankedTask[];
  deadlineRisks: string[];
  progressStats: Record<string, number>;
}

export interface PlanningSnapshot {
  id: string;
  type: "today" | "week";
  date: string;
  userId: string;
  summary: PlannerSummary;
  calendarConstraints: NormalizedCalendarEvent[];
  rankedTasks: RankedTask[];
  warnings: string[];
  rawStats: Record<string, unknown>;
  createdAt: string;
}
