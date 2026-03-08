import type { PlannerSettings, PlannerWeekResult, RankedTask } from "@/lib/core/types";
import { generateContentPrompts } from "@/lib/planner/content-prompts";
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
      now,
    }))
    .sort((left, right) => right.score - left.score)
    .map((task, index): RankedTask => ({
      ...task,
      rank: index + 1,
    }));

  const warnings = [...new Set([...input.warnings, ...deriveWarnings(rankedPriorities, settings, now)])];
  const primaryFocus = derivePrimaryFocus(rankedPriorities);

  return {
    weekStart: toIsoDate(startOfWeek(now)),
    weekEnd: toIsoDate(endOfWeek(now)),
    summary,
    primaryFocus,
    rankedPriorities,
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
