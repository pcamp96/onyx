import type {
  NormalizedArticleEntry,
  NormalizedCalendarEvent,
  NormalizedTask,
  PlanningDebugRecord,
  TlwOverviewResponse,
} from "@/lib/core/types";

export interface PlannerAggregateInput {
  tasks: NormalizedTask[];
  calendarEvents: NormalizedCalendarEvent[];
  articleEntries: NormalizedArticleEntry[];
  tlwOverview?: TlwOverviewResponse;
  warnings: string[];
  debugRecord: Omit<PlanningDebugRecord, "id" | "userId" | "type">;
}
