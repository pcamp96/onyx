import type { NormalizedArticleEntry, PlannerSettings } from "@/lib/core/types";
import { isSameWeek } from "@/lib/utils/time";

export function summarizeArticles(entries: NormalizedArticleEntry[], settings: PlannerSettings, now: Date) {
  const thisWeek = entries.filter((entry) => isSameWeek(entry.submittedAt, now));
  const articlesSubmittedThisWeek = thisWeek.length;
  const estimatedPaySoFar = thisWeek.reduce((sum, entry) => sum + (entry.pay ?? 0), 0);

  return {
    articlesSubmittedThisWeek,
    weeklyMinimum: settings.weeklyArticleMinimum,
    weeklyGoal: settings.weeklyArticleGoal,
    remainingToMinimum: Math.max(0, settings.weeklyArticleMinimum - articlesSubmittedThisWeek),
    remainingToGoal: Math.max(0, settings.weeklyArticleGoal - articlesSubmittedThisWeek),
    estimatedPaySoFar: estimatedPaySoFar || undefined,
  };
}
