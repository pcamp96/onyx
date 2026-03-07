import type {
  PlannerSettings,
  PlannerTodayResult,
  RankedTask,
} from "@/lib/core/types";
import { derivePrimaryFocus, deriveWarnings } from "@/lib/planner/rules";
import { scoreTask } from "@/lib/planner/scoring";
import { summarizeArticles } from "@/lib/planner/normalizers";
import { toIsoDate } from "@/lib/utils/time";

import type { PlannerAggregateInput } from "@/lib/core/services";

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
    .slice(0, settings.maxTodayTasks)
    .map((task, index): RankedTask => ({
      ...task,
      rank: index + 1,
    }));

  return {
    date: toIsoDate(now),
    summary,
    calendarConstraints: input.calendarEvents,
    primaryFocus: derivePrimaryFocus(rankedTasks),
    rankedTasks,
    warnings: deriveWarnings(rankedTasks, settings),
  };
}
