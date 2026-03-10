import type {
  CalendarConstraintPreview,
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
import { formatDueLabel, formatLocalDateLabel, formatLocalTimeRangeLabel, isDateOnlyValue } from "@/lib/utils/time";

function toRankedTaskPreview(task: RankedTask, timezone: string): RankedTaskPreview {
  return {
    id: task.id,
    source: task.source,
    sourceId: task.sourceId,
    sourceUrl: task.sourceUrl,
    area: task.area,
    title: task.title,
    status: task.status,
    dueDate: task.dueDate,
    dueLabel: formatDueLabel(task.dueDate, timezone),
    isDateOnlyDue: isDateOnlyValue(task.dueDate),
    isOverdue: task.isOverdue,
    isBlocked: task.isBlocked,
    rank: task.rank,
    reason: task.reason,
  };
}

function toCalendarConstraintPreview(
  event: PlannerTodayResult["calendarConstraints"][number],
  timezone: string,
): CalendarConstraintPreview {
  return {
    ...event,
    localDateLabel: formatLocalDateLabel(event.start, timezone),
    localTimeRangeLabel: formatLocalTimeRangeLabel(event.start, event.end, timezone, event.allDay),
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
    timezone: result.timezone,
    summary: result.summary,
    pace: result.pace,
    calendarConstraints: result.calendarConstraints.map((event) => toCalendarConstraintPreview(event, result.timezone)),
    primaryFocus: result.primaryFocus,
    approvedHtgTasks: result.approvedHtgTasks.map((task) => toRankedTaskPreview(task, result.timezone)),
    approvedHtgRemainingCount: result.approvedHtgRemainingCount,
    priorityTasks: result.priorityTasks.map((task) => toRankedTaskPreview(task, result.timezone)),
    otherTasks: overflow.visible.map((task) => toRankedTaskPreview(task, result.timezone)),
    tomorrowTasks: result.tomorrowTasks.map((task) => toRankedTaskPreview(task, result.timezone)),
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
    timezone: result.timezone,
    summary: result.summary,
    pace: result.pace,
    primaryFocus: result.primaryFocus,
    approvedHtgTasks: result.approvedHtgTasks.map((task) => toRankedTaskPreview(task, result.timezone)),
    otherPriorities: result.otherPriorities.map((task) => toRankedTaskPreview(task, result.timezone)),
    rankedPriorities: overflow.visible.map((task) => toRankedTaskPreview(task, result.timezone)),
    areaPriorities: {
      HTG: result.areaPriorities.HTG.map((task) => toRankedTaskPreview(task, result.timezone)),
      TLW: result.areaPriorities.TLW.map((task) => toRankedTaskPreview(task, result.timezone)),
      CREATED_WORKSHOP: result.areaPriorities.CREATED_WORKSHOP.map((task) => toRankedTaskPreview(task, result.timezone)),
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
    rankedContext: overflow.visible.map((task) => toRankedTaskPreview(task, "UTC")),
    rankedContextRemainingCount: overflow.remainingCount,
    rankedContextRemainingByArea: overflow.remainingByArea,
    generatedAt: result.generatedAt,
  };
}
