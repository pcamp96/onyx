import type {
  NormalizedCalendarEvent,
  NormalizedTask,
  PlannerPace,
  PlannerSettings,
  RankedTask,
} from "@/lib/core/types";
import { daysUntil } from "@/lib/utils/time";

interface ScoreInput {
  task: NormalizedTask;
  settings: PlannerSettings;
  pace: PlannerPace;
  calendarConstraints: NormalizedCalendarEvent[];
  now: Date;
}

function calendarCapacityAdjustment(events: NormalizedCalendarEvent[]) {
  const minutes = events.reduce((total, event) => {
    return total + (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60);
  }, 0);

  return Math.min(18, Math.round(minutes / 90));
}

export function scoreTask({ task, settings, pace, calendarConstraints, now }: ScoreInput): RankedTask {
  const daysToDeadline = daysUntil(task.dueDate, now, settings.timezone);
  const deadlineScore =
    daysToDeadline === null ? 0 : daysToDeadline <= 0 ? 24 : Math.max(0, 18 - daysToDeadline * 2);
  const pacePressure = Math.ceil(Math.max(pace.behindBeforeToday, pace.neededTodayToStayOnPace));
  const paceScore = task.area === "HTG" ? pacePressure * 4 : pacePressure > 0 ? 2 : 0;
  const incomeScore = Math.min(14, Math.round(task.incomeImpact ?? 0));
  const businessScore = Math.min(12, Math.round(task.businessImpact ?? 0));
  const blockedAdjustment = task.isBlocked ? -10 : 0;
  const urgencyScore = task.priority ? Math.min(10, task.priority * 2) : 0;
  const areaWeight = settings.areaWeights[task.area] ?? 0;
  const overdueAdjustment = task.isOverdue ? 14 : 0;
  const sponsorRiskAdjustment = task.sponsorRisk ? 16 : 0;
  const calendarAdjustment = -calendarCapacityAdjustment(calendarConstraints);

  const createdWorkshopAdjustment =
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
    blockedAdjustment +
    urgencyScore +
    areaWeight +
    overdueAdjustment +
    sponsorRiskAdjustment +
    calendarAdjustment +
    createdWorkshopAdjustment;

  const reasonParts = [];
  if (task.area === "HTG" && pace.status === "behind") {
    reasonParts.push("Writing pace is behind before today.");
  } else if (task.area === "HTG" && pace.status === "due_today") {
    reasonParts.push("Writing progress today keeps the weekly minimum on pace.");
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
      deadlineProximity: deadlineScore,
      writingPaceGap: paceScore,
      incomeImpact: incomeScore,
      businessImpact: businessScore,
      urgency: urgencyScore,
      areaWeight,
      overdueAdjustment,
      calendarCapacityAdjustment: calendarAdjustment,
      sponsorRiskAdjustment,
      blockedAdjustment,
      createdWorkshopAdjustment,
    },
  };
}
