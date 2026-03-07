import { OverviewDashboard } from "@/components/overview/overview-dashboard";
import { FOUNDER_USER_ID } from "@/lib/config/constants";
import { planningSnapshotsRepository } from "@/lib/firebase/repositories/planning-snapshots";

export default async function OverviewPage() {
  const [today, week] = await Promise.all([
    planningSnapshotsRepository.getLatest(FOUNDER_USER_ID, "today"),
    planningSnapshotsRepository.getLatest(FOUNDER_USER_ID, "week"),
  ]);

  return <OverviewDashboard today={today ? { ...today, primaryFocus: today.rankedTasks[0]?.title ?? "No plan yet" } : null} week={week ? {
    weekStart: week.date,
    weekEnd: week.date,
    summary: week.summary,
    rankedPriorities: week.rankedTasks,
    deadlineRisks: week.warnings,
    progressStats: {},
  } : null} />;
}
