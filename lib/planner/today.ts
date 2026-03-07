import type {
  PlannerSettings,
  PlannerTodayResult,
  RankedTask,
} from "@/lib/core/types";
import { generateContentPrompts } from "@/lib/planner/content-prompts";
import { derivePrimaryFocus, deriveWarnings } from "@/lib/planner/rules";
import { scoreTask } from "@/lib/planner/scoring";
import { summarizeArticles } from "@/lib/planner/normalizers";
import type { PlannerAggregateInput } from "@/lib/planner/types";
import { toIsoDate } from "@/lib/utils/time";

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
  const warnings = [...new Set([...input.warnings, ...deriveWarnings(rankedTasks, settings)])];
  const primaryFocus = derivePrimaryFocus(rankedTasks);

  return {
    date: toIsoDate(now),
    summary,
    calendarConstraints: input.calendarEvents,
    primaryFocus,
    rankedTasks,
    warnings,
    contentPrompts: generateContentPrompts({
      command: "today",
      summary,
      rankedTasks,
      warnings,
      articleEntries: input.articleEntries,
      primaryFocus,
    }),
    generatedAt: now.toISOString(),
  };
}
