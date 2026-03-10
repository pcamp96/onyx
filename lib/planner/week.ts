import type { PlannerSettings, PlannerWeekResult, RankedTask } from "@/lib/core/types";
import { generateContentPrompts } from "@/lib/planner/content-prompts";
import { buildPlannerPace } from "@/lib/planner/pace";
import { deriveWarnings } from "@/lib/planner/rules";
import { derivePrimaryFocus } from "@/lib/planner/rules";
import { scoreTask } from "@/lib/planner/scoring";
import { summarizeArticles } from "@/lib/planner/normalizers";
import { compareDueDates, endOfWeek, isSameWeek, startOfWeek, toIsoDate } from "@/lib/utils/time";
import type { PlannerAggregateInput } from "@/lib/planner/types";

const WEEKLY_AREA_LIMIT = 3;

function buildAreaPriorities(rankedPriorities: RankedTask[]) {
  return {
    HTG: rankedPriorities.filter((task) => task.area === "HTG").slice(0, WEEKLY_AREA_LIMIT),
    TLW: rankedPriorities.filter((task) => task.area === "TLW").slice(0, WEEKLY_AREA_LIMIT),
    CREATED_WORKSHOP: rankedPriorities.filter((task) => task.area === "CREATED_WORKSHOP").slice(0, WEEKLY_AREA_LIMIT),
  };
}

function isApprovedHtgTask(task: RankedTask) {
  return task.area === "HTG" && task.source === "asana";
}

export function buildWeekPlan(input: PlannerAggregateInput, settings: PlannerSettings, now: Date): PlannerWeekResult {
  const summary = summarizeArticles(input.articleEntries, settings, now);
  const pace = buildPlannerPace(summary, settings, now);
  const rankedPriorities = input.tasks
    .map((task) => scoreTask({
      task,
      settings,
      pace,
      calendarConstraints: input.calendarEvents,
      now,
    }))
    .sort((left, right) => right.score - left.score)
    .map((task, index): RankedTask => ({
      ...task,
      rank: index + 1,
    }));
  const approvedHtgTasks = rankedPriorities
    .filter((task) => isApprovedHtgTask(task) && (task.isOverdue || (task.dueDate && isSameWeek(task.dueDate, now, settings.timezone))))
    .sort((left, right) => compareDueDates(left.dueDate, right.dueDate, now, settings.timezone));
  const otherPriorities = rankedPriorities.filter((task) => !isApprovedHtgTask(task));

  const warnings = [...new Set([...input.warnings, ...deriveWarnings(rankedPriorities, settings, pace, now)])];
  const primaryFocus = derivePrimaryFocus(approvedHtgTasks.length ? approvedHtgTasks : rankedPriorities);

  return {
    weekStart: toIsoDate(startOfWeek(now, settings.timezone)),
    weekEnd: toIsoDate(endOfWeek(now, settings.timezone)),
    timezone: settings.timezone,
    summary,
    pace,
    primaryFocus,
    approvedHtgTasks,
    otherPriorities,
    rankedPriorities,
    areaPriorities: buildAreaPriorities(rankedPriorities),
    deadlineRisks: warnings,
    warnings,
    contentPrompts: generateContentPrompts({
      command: "week",
      summary,
      rankedTasks: rankedPriorities,
      warnings,
      articleEntries: input.articleEntries,
      primaryFocus,
    }),
    generatedAt: now.toISOString(),
  };
}
