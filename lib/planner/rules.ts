import type { NormalizedTask, PlannerSettings } from "@/lib/core/types";
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

export function deriveWarnings(tasks: NormalizedTask[], settings: PlannerSettings) {
  const warnings: string[] = [];
  const sponsorRiskTask = tasks.find((task) => task.sponsorRisk);
  if (sponsorRiskTask) {
    warnings.push("Sponsor deliverable is at risk.");
  }

  const urgentCreatedWorkshop = tasks.find((task) => {
    const days = daysUntil(task.dueDate);
    return task.area === "CREATED_WORKSHOP" && days !== null && days <= settings.sponsorUrgencyDays;
  });
  if (urgentCreatedWorkshop) {
    warnings.push("Created Workshop item has a real deadline and moved up.");
  }

  return warnings;
}
