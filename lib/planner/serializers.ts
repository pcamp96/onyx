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

const MAX_OTHER_TASKS = 100;
const MAX_WEEK_PRIORITIES = 12;
const MAX_IDEAS_CONTEXT = 6;

function summarizeOverflowTasks<T extends { area: WorkArea }>(tasks: T[], visibleCount: number) {
  const visible = tasks.slice(0, visibleCount);
  const overflow = tasks.slice(visibleCount);
  const byArea = overflow.reduce<Partial<Record<WorkArea, number>>>((acc, task) => {
    acc[task.area] = (acc[task.area] ?? 0) + 1;
    return acc;
  }, {});

  return {
    visible,
    remainingCount: overflow.length,
    remainingByArea: byArea,
  };
}

export function toTodayApiResult(result: PlannerTodayResult): PlannerTodayApiResult {
  const overflow = summarizeOverflowTasks(result.otherTasks, MAX_OTHER_TASKS);

  return {
    date: result.date,
    summary: result.summary,
    calendarConstraints: result.calendarConstraints,
    primaryFocus: result.primaryFocus,
    priorityTasks: result.priorityTasks.map(toRankedTaskPreview),
    otherTasks: overflow.visible.map(toRankedTaskPreview),
    tomorrowTasks: result.tomorrowTasks.map(toRankedTaskPreview),
    otherTasksRemainingCount: overflow.remainingCount,
    otherTasksRemainingByArea: overflow.remainingByArea,
    warnings: result.warnings,
    contentPrompts: result.contentPrompts,
    tlwOperatorPlan: result.tlwOperatorPlan,
    generatedAt: result.generatedAt,
  };
}

export function toWeekApiResult(result: PlannerWeekResult): PlannerWeekApiResult {
  const overflow = summarizeOverflowTasks(result.rankedPriorities, MAX_WEEK_PRIORITIES);

  return {
    weekStart: result.weekStart,
    weekEnd: result.weekEnd,
    summary: result.summary,
    primaryFocus: result.primaryFocus,
    rankedPriorities: overflow.visible.map(toRankedTaskPreview),
    areaPriorities: {
      HTG: result.areaPriorities.HTG.map(toRankedTaskPreview),
      TLW: result.areaPriorities.TLW.map(toRankedTaskPreview),
      CREATED_WORKSHOP: result.areaPriorities.CREATED_WORKSHOP.map(toRankedTaskPreview),
    },
    rankedPrioritiesRemainingCount: overflow.remainingCount,
    rankedPrioritiesRemainingByArea: overflow.remainingByArea,
    deadlineRisks: result.deadlineRisks,
    warnings: result.warnings,
    contentPrompts: result.contentPrompts,
    generatedAt: result.generatedAt,
  };
}

export function toIdeasApiResult(result: PlannerIdeasResult): PlannerIdeasApiResult {
  const overflow = summarizeOverflowTasks(result.rankedContext, MAX_IDEAS_CONTEXT);

  return {
    summary: result.summary,
    primaryFocus: result.primaryFocus,
    contentPrompts: result.contentPrompts,
    warnings: result.warnings,
    rankedContext: overflow.visible.map(toRankedTaskPreview),
    rankedContextRemainingCount: overflow.remainingCount,
    rankedContextRemainingByArea: overflow.remainingByArea,
    generatedAt: result.generatedAt,
  };
}
