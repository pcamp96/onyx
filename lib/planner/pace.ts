import type { PlannerPace, PlannerSettings, PlannerSummary } from "@/lib/core/types";
import { countWorkdaysBeforeToday, localWeekday, roundPlannerNumber } from "@/lib/utils/time";

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

function normalizeWorkdays(workdays: number[]): number[] {
  const seen = new Set<number>();
  return Array.from(WEEKDAY_ORDER).filter((day) => workdays.includes(day) && !seen.has(day) && seen.add(day));
}

export function buildPlannerPace(summary: PlannerSummary, settings: PlannerSettings, now: Date): PlannerPace {
  const workdays = normalizeWorkdays(settings.workdays);
  const workdaysInWeek = Math.max(1, workdays.length);
  const workdaysElapsedBeforeToday = countWorkdaysBeforeToday(workdays, now, settings.timezone);
  const todayIsWorkday = workdays.includes(localWeekday(now, settings.timezone));
  const dailyMinimumRate = roundPlannerNumber(summary.weeklyMinimum / workdaysInWeek);
  const expectedBeforeToday = dailyMinimumRate * workdaysElapsedBeforeToday;
  const targetByEndOfToday = roundPlannerNumber(expectedBeforeToday + (todayIsWorkday ? dailyMinimumRate : 0));
  const behindBeforeToday = roundPlannerNumber(Math.max(0, expectedBeforeToday - summary.articlesSubmittedThisWeek));
  const neededTodayToStayOnPace = roundPlannerNumber(
    todayIsWorkday ? Math.max(0, targetByEndOfToday - summary.articlesSubmittedThisWeek) : 0,
  );

  const status =
    behindBeforeToday > 0
      ? "behind"
      : neededTodayToStayOnPace > 0
        ? "due_today"
        : "on_track";

  return {
    status,
    weeklyMinimum: summary.weeklyMinimum,
    workdaysInWeek,
    workdaysElapsedBeforeToday,
    dailyMinimumRate,
    targetByEndOfToday,
    submittedThisWeek: summary.articlesSubmittedThisWeek,
    behindBeforeToday,
    neededTodayToStayOnPace,
  };
}

export function getPacePressure(pace: PlannerPace) {
  return Math.ceil(Math.max(pace.behindBeforeToday, pace.neededTodayToStayOnPace));
}
