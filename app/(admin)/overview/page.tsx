import { FirestoreSetupState } from "@/components/layout/firestore-setup-state";
import { OverviewDashboard } from "@/components/overview/overview-dashboard";
import { requireSession } from "@/lib/firebase/auth";
import { getFirestoreSetupMessage, isFirestoreSetupError } from "@/lib/firebase/errors";
import { getLatestPlannerArtifacts } from "@/lib/planner/service";

export default async function OverviewPage() {
  const session = await requireSession();
  let todaySnapshot = null;
  let weekSnapshot = null;

  try {
    const artifacts = await getLatestPlannerArtifacts(session.uid);
    todaySnapshot = artifacts.todaySnapshot;
    weekSnapshot = artifacts.weekSnapshot;
  } catch (error) {
    if (isFirestoreSetupError(error)) {
      return (
        <FirestoreSetupState
          title="Firestore is not ready yet"
          message={getFirestoreSetupMessage(error)}
        />
      );
    }

    throw error;
  }

  return <OverviewDashboard today={todaySnapshot} week={weekSnapshot} />;
}
