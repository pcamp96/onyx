import { DebugPanel } from "@/components/debug/debug-panel";
import { FirestoreSetupState } from "@/components/layout/firestore-setup-state";
import { requireSession } from "@/lib/firebase/auth";
import { getFirestoreSetupMessage, isFirestoreSetupError } from "@/lib/firebase/errors";
import { getLatestPlannerArtifacts } from "@/lib/planner/service";

export default async function DebugPage() {
  const session = await requireSession();
  let todaySnapshot = null;
  let weekSnapshot = null;
  let todayDebug = null;
  let weekDebug = null;

  try {
    const artifacts = await getLatestPlannerArtifacts(session.uid);
    todaySnapshot = artifacts.todaySnapshot;
    weekSnapshot = artifacts.weekSnapshot;
    todayDebug = artifacts.todayDebug;
    weekDebug = artifacts.weekDebug;
  } catch (error) {
    if (isFirestoreSetupError(error)) {
      return (
        <FirestoreSetupState
          title="Firestore debug data is unavailable"
          message={getFirestoreSetupMessage(error)}
        />
      );
    }

    throw error;
  }

  return <DebugPanel todaySnapshot={todaySnapshot} weekSnapshot={weekSnapshot} todayDebug={todayDebug} weekDebug={weekDebug} />;
}
