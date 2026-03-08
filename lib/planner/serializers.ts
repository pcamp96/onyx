import type {
  WorkArea,
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

const MAX_OTHER_TASKS = 12;

function summarizeOverflowTasks(tasks: RankedTask[]) {
  const overflow = tasks.slice(MAX_OTHER_TASKS);
  const byArea = overflow.reduce<Partial<Record<WorkArea, number>>>((acc, task) => {
    acc[task.area] = (acc[task.area] ?? 0) + 1;
    return acc;
  }, {});

  return {
    visible: tasks.slice(0, MAX_OTHER_TASKS),
    remainingCount: overflow.length,
    remainingByArea: byArea,
  };
}

export function toTodayApiResult(result: PlannerTodayResult): PlannerTodayApiResult {
  const overflow = summarizeOverflowTasks(result.otherTasks);

  return {
    date: result.date,
    summary: result.summary,
    calendarConstraints: result.calendarConstraints,
    primaryFocus: result.primaryFocus,
    priorityTasks: result.priorityTasks.map(toRankedTaskPreview),
    otherTasks: overflow.visible.map(toRankedTaskPreview),
    otherTasksRemainingCount: overflow.remainingCount,
    otherTasksRemainingByArea: overflow.remainingByArea,
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
