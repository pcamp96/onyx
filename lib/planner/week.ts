import type { PlannerSettings, PlannerWeekResult, RankedTask } from "@/lib/core/types";
import { deriveWarnings } from "@/lib/planner/rules";
import { derivePrimaryFocus } from "@/lib/planner/rules";
import { scoreTask } from "@/lib/planner/scoring";
import { summarizeArticles } from "@/lib/planner/normalizers";
import { endOfWeek, startOfWeek, toIsoDate } from "@/lib/utils/time";
import type { PlannerAggregateInput } from "@/lib/planner/types";

export function buildWeekPlan(input: PlannerAggregateInput, settings: PlannerSettings, now: Date): PlannerWeekResult {
  const summary = summarizeArticles(input.articleEntries, settings, now);
  const weeklyPaceGap = summary.remainingToGoal;
  const rankedPriorities = input.tasks
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

  const warnings = [...new Set([...input.warnings, ...deriveWarnings(rankedPriorities, settings)])];

  return {
    weekStart: toIsoDate(startOfWeek(now)),
    weekEnd: toIsoDate(endOfWeek(now)),
    summary,
    primaryFocus: derivePrimaryFocus(rankedPriorities),
    rankedPriorities,
    deadlineRisks: warnings,
    warnings,
    generatedAt: now.toISOString(),
  };
}
