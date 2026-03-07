import { DebugPanel } from "@/components/debug/debug-panel";
import { requireSession } from "@/lib/firebase/auth";
import { getLatestPlannerArtifacts } from "@/lib/planner/service";

export default async function DebugPage() {
  const session = await requireSession();
  const { todaySnapshot, weekSnapshot, todayDebug, weekDebug } = await getLatestPlannerArtifacts(session.uid);

  return <DebugPanel todaySnapshot={todaySnapshot} weekSnapshot={weekSnapshot} todayDebug={todayDebug} weekDebug={weekDebug} />;
}
