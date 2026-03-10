import type { PlannerSettings, PlannerTodayResult, RankedTask } from "@/lib/core/types";
import { generateContentPrompts } from "@/lib/planner/content-prompts";
import { buildPlannerPace, getPacePressure } from "@/lib/planner/pace";
import { derivePrimaryFocus, deriveWarnings } from "@/lib/planner/rules";
import { scoreTask } from "@/lib/planner/scoring";
import { summarizeArticles } from "@/lib/planner/normalizers";
import type { PlannerAggregateInput } from "@/lib/planner/types";
import { compareDueDates, daysUntil, toIsoDate } from "@/lib/utils/time";

const DAILY_PRIORITY_CAPS: Partial<Record<RankedTask["area"], number>> = {
  HTG: 3,
  TLW: 3,
  CREATED_WORKSHOP: 3,
};
const PRIMARY_TASK_LIMIT = 3;

function isApprovedHtgTask(task: RankedTask) {
  return task.area === "HTG" && task.source === "asana";
}

function splitTodayTasks(tasks: RankedTask[], pacePressure: number) {
  const priorityCounts = new Map<RankedTask["area"], number>();
  const priorityTasks: RankedTask[] = [];
  const otherTasks: RankedTask[] = [];
  const maxHtgTasks = Math.max(1, Math.min(3, pacePressure + 1));

  for (const task of tasks) {
    const cap = task.area === "HTG" ? maxHtgTasks : DAILY_PRIORITY_CAPS[task.area];
    const currentCount = priorityCounts.get(task.area) ?? 0;

    if (cap !== undefined && currentCount >= cap) {
      otherTasks.push(task);
      continue;
    }

    priorityTasks.push(task);
    priorityCounts.set(task.area, currentCount + 1);
  }

  return {
    priorityTasks,
    otherTasks,
  };
}

function shouldSurfaceTodayTask(task: RankedTask, settings: PlannerSettings, now: Date) {
  if (task.isOverdue) {
    return true;
  }

  if (task.sponsorRisk) {
    return true;
  }

  const daysToDeadline = daysUntil(task.dueDate, now, settings.timezone);
  if (daysToDeadline !== null) {
    return daysToDeadline <= 0;
  }

  return false;
}

function shouldSurfaceTomorrowTask(task: RankedTask, settings: PlannerSettings, now: Date) {
  const daysToDeadline = daysUntil(task.dueDate, now, settings.timezone);
  return daysToDeadline === 1;
}

function dedupeTasks(tasks: RankedTask[]) {
  const seen = new Set<string>();

  return tasks.filter((task) => {
    if (seen.has(task.id)) {
      return false;
    }

    seen.add(task.id);
    return true;
  });
}

export function buildTodayPlan(input: PlannerAggregateInput, settings: PlannerSettings, now: Date): PlannerTodayResult {
  const summary = summarizeArticles(input.articleEntries, settings, now);
  const pace = buildPlannerPace(summary, settings, now);
  const pacePressure = getPacePressure(pace);
  const scoredTasks = input.tasks
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
  const dueAndRiskTasks = scoredTasks.filter((task) => shouldSurfaceTodayTask(task, settings, now));
  const taskPool = dedupeTasks(dueAndRiskTasks);
  const rankedTasks = (taskPool.length ? taskPool : scoredTasks.slice(0, settings.maxTodayTasks * 2))
    .map((task, index): RankedTask => ({
      ...task,
      rank: index + 1,
    }));
  const approvedHtgCandidates = dedupeTasks(scoredTasks.filter((task) => isApprovedHtgTask(task)))
    .sort((left, right) => compareDueDates(left.dueDate, right.dueDate, now, settings.timezone))
    .map((task) => rankedTasks.find((entry) => entry.id === task.id) ?? task);
  const approvedHtgTasks = approvedHtgCandidates.slice(0, 3);
  const approvedHtgTaskIds = new Set(approvedHtgCandidates.map((task) => task.id));
  const tomorrowTasks = dedupeTasks(
    scoredTasks.filter(
      (task) =>
        !approvedHtgTaskIds.has(task.id) &&
        !shouldSurfaceTodayTask(task, settings, now) &&
        shouldSurfaceTomorrowTask(task, settings, now),
    ),
  );
  const generalRankedTasks = rankedTasks.filter((task) => !approvedHtgTaskIds.has(task.id));
  const { priorityTasks, otherTasks } = splitTodayTasks(generalRankedTasks, pacePressure);
  const topPriorityTasks = priorityTasks.slice(0, Math.min(settings.maxTodayTasks, PRIMARY_TASK_LIMIT));
  const priorityTaskIds = new Set(topPriorityTasks.map((task) => task.id));
  const remainingPriorityTasks = priorityTasks.filter((task) => !priorityTaskIds.has(task.id));
  const surfacedOtherTasks = [...remainingPriorityTasks, ...otherTasks];
  const warnings = [...new Set([...input.warnings, ...deriveWarnings(rankedTasks, settings, pace, now)])];
  const primaryFocus = derivePrimaryFocus(
    approvedHtgTasks.length ? approvedHtgTasks : topPriorityTasks.length ? topPriorityTasks : rankedTasks,
  );

  return {
    date: toIsoDate(now, settings.timezone),
    timezone: settings.timezone,
    summary,
    pace,
    calendarConstraints: input.calendarEvents,
    primaryFocus,
    approvedHtgTasks,
    approvedHtgRemainingCount: Math.max(0, approvedHtgCandidates.length - approvedHtgTasks.length),
    priorityTasks: topPriorityTasks,
    otherTasks: surfacedOtherTasks,
    tomorrowTasks,
    rankedTasks,
    warnings,
    contentPrompts: generateContentPrompts({
      command: "today",
      summary,
      rankedTasks: topPriorityTasks.length ? topPriorityTasks : rankedTasks,
      warnings,
      articleEntries: input.articleEntries,
      primaryFocus,
    }),
    generatedAt: now.toISOString(),
  };
}
