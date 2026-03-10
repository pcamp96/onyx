import type { NormalizedTask, PlannerPace, PlannerSettings } from "@/lib/core/types";
import { daysUntil } from "@/lib/utils/time";

export function derivePrimaryFocus(tasks: NormalizedTask[]) {
  const first = tasks[0];
  if (!first) {
    return "Inbox cleanup";
  }

  if (first.area === "HTG") {
    return "How-To Geek output";
  }
  if (first.area === "TLW") {
    return "Laser Workshop momentum";
  }
  if (first.area === "CREATED_WORKSHOP") {
    return "Created Workshop deadline coverage";
  }
  return "Admin cleanup";
}

function formatPaceCount(value: number) {
  const rounded = Number(value.toFixed(2));
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
}

export function deriveWarnings(tasks: NormalizedTask[], settings: PlannerSettings, pace?: PlannerPace, now = new Date()) {
  const warnings: string[] = [];
  const sponsorRiskTask = tasks.find((task) => task.sponsorRisk);
  if (sponsorRiskTask) {
    warnings.push("Sponsor deliverable is at risk.");
  }

  const urgentCreatedWorkshop = tasks.find((task) => {
    const days = daysUntil(task.dueDate, now, settings.timezone);
    return task.area === "CREATED_WORKSHOP" && days !== null && days <= settings.sponsorUrgencyDays;
  });
  if (urgentCreatedWorkshop) {
    warnings.push("Created Workshop item has a real deadline and moved up.");
  }

  if (pace?.status === "behind") {
    warnings.push(`HTG minimum pace is behind before today. You need ${formatPaceCount(pace.neededTodayToStayOnPace)} article(s) today.`);
  } else if (pace?.status === "due_today") {
    warnings.push(`HTG minimum pace needs ${formatPaceCount(pace.neededTodayToStayOnPace)} article(s) today to stay on track.`);
  }

  return warnings;
}
