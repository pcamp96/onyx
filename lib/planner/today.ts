import type { PlannerSettings, PlannerTodayResult, RankedTask } from "@/lib/core/types";
import { generateContentPrompts } from "@/lib/planner/content-prompts";
import { derivePrimaryFocus, deriveWarnings } from "@/lib/planner/rules";
import { scoreTask } from "@/lib/planner/scoring";
import { summarizeArticles } from "@/lib/planner/normalizers";
import type { PlannerAggregateInput } from "@/lib/planner/types";
import { toIsoDate } from "@/lib/utils/time";

const DAILY_PRIORITY_CAPS: Partial<Record<RankedTask["area"], number>> = {
  HTG: 3,
  TLW: 3,
  CREATED_WORKSHOP: 3,
};

function getMaxHtgTasks(weeklyPaceGap: number) {
  return Math.max(1, Math.min(3, weeklyPaceGap + 1));
}

function splitTodayTasks(tasks: RankedTask[], weeklyPaceGap: number) {
  const priorityCounts = new Map<RankedTask["area"], number>();
  const priorityTasks: RankedTask[] = [];
  const otherTasks: RankedTask[] = [];
  const maxHtgTasks = getMaxHtgTasks(weeklyPaceGap);

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

export function buildTodayPlan(input: PlannerAggregateInput, settings: PlannerSettings, now: Date): PlannerTodayResult {
  const summary = summarizeArticles(input.articleEntries, settings, now);
  const weeklyPaceGap = summary.remainingToMinimum;
  const rankedTasks = input.tasks
      .map((task) => scoreTask({
        task,
        settings,
        weeklyPaceGap,
        calendarConstraints: input.calendarEvents,
      }))
      .sort((left, right) => right.score - left.score)
      .map((task, index): RankedTask => ({
        ...task,
        rank: index + 1,
      }));
  const { priorityTasks, otherTasks } = splitTodayTasks(rankedTasks, weeklyPaceGap);
  const topPriorityTasks = priorityTasks.slice(0, settings.maxTodayTasks);
  const priorityTaskIds = new Set(topPriorityTasks.map((task) => task.id));
  const remainingPriorityTasks = priorityTasks.filter((task) => !priorityTaskIds.has(task.id));
  const surfacedOtherTasks = [...remainingPriorityTasks, ...otherTasks];
  const warnings = [...new Set([...input.warnings, ...deriveWarnings(rankedTasks, settings)])];
  const primaryFocus = derivePrimaryFocus(topPriorityTasks.length ? topPriorityTasks : rankedTasks);

  return {
    date: toIsoDate(now),
    summary,
    calendarConstraints: input.calendarEvents,
    primaryFocus,
    priorityTasks: topPriorityTasks,
    otherTasks: surfacedOtherTasks,
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
