import { OverviewDashboard } from "@/components/overview/overview-dashboard";
import { requireSession } from "@/lib/firebase/auth";
import { getLatestPlannerArtifacts } from "@/lib/planner/service";

export default async function OverviewPage() {
  const session = await requireSession();
  const { todaySnapshot, weekSnapshot } = await getLatestPlannerArtifacts(session.uid);

  return <OverviewDashboard today={todaySnapshot} week={weekSnapshot} />;
}
