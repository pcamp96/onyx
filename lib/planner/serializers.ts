import type {
  PlannerIdeasApiResult,
  PlannerIdeasResult,
  PlannerTodayApiResult,
  PlannerTodayResult,
  PlannerWeekApiResult,
  PlannerWeekResult,
  RankedTask,
  RankedTaskPreview,
} from "@/lib/core/types";

function toRankedTaskPreview(task: RankedTask): RankedTaskPreview {
  return {
    id: task.id,
    source: task.source,
    sourceId: task.sourceId,
    sourceUrl: task.sourceUrl,
    area: task.area,
    title: task.title,
    status: task.status,
    dueDate: task.dueDate,
    isOverdue: task.isOverdue,
    isBlocked: task.isBlocked,
    rank: task.rank,
    reason: task.reason,
  };
}

export function toTodayApiResult(result: PlannerTodayResult): PlannerTodayApiResult {
  return {
    date: result.date,
    summary: result.summary,
    calendarConstraints: result.calendarConstraints,
    primaryFocus: result.primaryFocus,
    priorityTasks: result.priorityTasks.map(toRankedTaskPreview),
    otherTasks: result.otherTasks.map(toRankedTaskPreview),
    warnings: result.warnings,
    contentPrompts: result.contentPrompts,
    generatedAt: result.generatedAt,
  };
}

export function toWeekApiResult(result: PlannerWeekResult): PlannerWeekApiResult {
  return {
    weekStart: result.weekStart,
    weekEnd: result.weekEnd,
    summary: result.summary,
    primaryFocus: result.primaryFocus,
    rankedPriorities: result.rankedPriorities.map(toRankedTaskPreview),
    deadlineRisks: result.deadlineRisks,
    warnings: result.warnings,
    contentPrompts: result.contentPrompts,
    generatedAt: result.generatedAt,
  };
}

export function toIdeasApiResult(result: PlannerIdeasResult): PlannerIdeasApiResult {
  return {
    summary: result.summary,
    primaryFocus: result.primaryFocus,
    contentPrompts: result.contentPrompts,
    warnings: result.warnings,
    rankedContext: result.rankedContext.map(toRankedTaskPreview),
    generatedAt: result.generatedAt,
  };
}
