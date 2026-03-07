import type {
  NormalizedCalendarEvent,
  NormalizedTask,
  PlannerSettings,
  RankedTask,
} from "@/lib/core/types";
import { daysUntil } from "@/lib/utils/time";

interface ScoreInput {
  task: NormalizedTask;
  settings: PlannerSettings;
  weeklyPaceGap: number;
  calendarConstraints: NormalizedCalendarEvent[];
}

function calendarCapacityAdjustment(events: NormalizedCalendarEvent[]) {
  const minutes = events.reduce((total, event) => {
    return total + (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60);
  }, 0);

  return Math.min(18, Math.round(minutes / 90));
}

export function scoreTask({ task, settings, weeklyPaceGap, calendarConstraints }: ScoreInput): RankedTask {
  const daysToDeadline = daysUntil(task.dueAt);
  const deadlineScore =
    daysToDeadline === null ? 0 : daysToDeadline <= 0 ? 24 : Math.max(0, 18 - daysToDeadline * 2);
  const paceScore = task.area === "HTG" ? weeklyPaceGap * 4 : weeklyPaceGap > 0 ? 2 : 0;
  const incomeScore = Math.min(14, Math.round(task.incomeImpact ?? task.estimatedValue ?? 0));
  const businessScore = Math.min(12, Math.round(task.businessImpact ?? 0));
  const blockerPenalty = task.blockerIds?.length ? -10 : 0;
  const urgencyScore = task.priority ? Math.min(10, task.priority * 2) : 0;
  const areaWeight = settings.areaWeights[task.area] ?? 0;
  const overdueBoost = task.isOverdue ? 14 : 0;
  const sponsorRiskBoost = task.sponsorRisk ? 16 : 0;
  const capacityAdjustment = calendarCapacityAdjustment(calendarConstraints);

  const createdWorkshopPenalty =
    task.area === "CREATED_WORKSHOP" &&
    settings.createdWorkshopLowPriorityEnabled &&
    !task.sponsorRisk &&
    (daysToDeadline === null || daysToDeadline > settings.sponsorUrgencyDays)
      ? -14
      : 0;

  const total =
    deadlineScore +
    paceScore +
    incomeScore +
    businessScore +
    blockerPenalty +
    urgencyScore +
    areaWeight +
    overdueBoost +
    sponsorRiskBoost -
    capacityAdjustment +
    createdWorkshopPenalty;

  const reasonParts = [];
  if (task.area === "HTG" && weeklyPaceGap > 0) {
    reasonParts.push("You are behind weekly writing pace.");
  }
  if (task.sponsorRisk) {
    reasonParts.push("Sponsor risk raises urgency.");
  }
  if (task.isOverdue) {
    reasonParts.push("This task is overdue.");
  }
  if (daysToDeadline !== null && daysToDeadline <= settings.sponsorUrgencyDays) {
    reasonParts.push("The deadline is close.");
  }
  if (reasonParts.length === 0) {
    reasonParts.push("This has the strongest execution value right now.");
  }

  return {
    ...task,
    score: total,
    rank: 0,
    reason: reasonParts.join(" "),
    scoreBreakdown: {
      deadline: deadlineScore,
      weeklyPace: paceScore,
      incomeImpact: incomeScore,
      businessImpact: businessScore,
      blockerPenalty,
      urgency: urgencyScore,
      areaWeight,
      calendarCapacityAdjustment: -capacityAdjustment,
      overdueBoost,
      sponsorRiskBoost,
    },
  };
}
