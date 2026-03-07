import { GptSetupPanel } from "@/components/gpt/gpt-setup-panel";
import { FirestoreSetupState } from "@/components/layout/firestore-setup-state";
import { requireSession } from "@/lib/firebase/auth";
import { getFirestoreSetupMessage, isFirestoreSetupError } from "@/lib/firebase/errors";
import { getGptSetupData } from "@/lib/gpt/service";

export default async function GptSetupPage() {
  const session = await requireSession();
  let setup = null;

  try {
    setup = await getGptSetupData(session.uid);
  } catch (error) {
    if (isFirestoreSetupError(error)) {
      return (
        <FirestoreSetupState
          title="GPT setup is unavailable"
          message={getFirestoreSetupMessage(error)}
        />
      );
    }

    throw error;
  }

  return <GptSetupPanel initialSetup={setup} />;
}
