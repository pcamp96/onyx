import { FirestoreSetupState } from "@/components/layout/firestore-setup-state";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireSession } from "@/lib/firebase/auth";
import { getFirestoreSetupMessage, isFirestoreSetupError } from "@/lib/firebase/errors";
import { plannerSettingsRepository } from "@/lib/firebase/repositories/planner-settings";

export default async function SettingsPage() {
  const session = await requireSession();
  let settings = null;

  try {
    settings = await plannerSettingsRepository.get(session.uid);
  } catch (error) {
    if (isFirestoreSetupError(error)) {
      return (
        <FirestoreSetupState
          title="Firestore settings are unavailable"
          message={getFirestoreSetupMessage(error)}
        />
      );
    }

    throw error;
  }

  return <SettingsForm initialSettings={settings} />;
}
