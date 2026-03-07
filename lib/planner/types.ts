import type { NormalizedArticleEntry, NormalizedCalendarEvent, NormalizedTask, PlanningDebugRecord } from "@/lib/core/types";

export interface PlannerAggregateInput {
  tasks: NormalizedTask[];
  calendarEvents: NormalizedCalendarEvent[];
  articleEntries: NormalizedArticleEntry[];
  warnings: string[];
  debugRecord: Omit<PlanningDebugRecord, "id" | "userId" | "type">;
}
