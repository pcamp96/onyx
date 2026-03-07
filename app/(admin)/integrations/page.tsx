import { FirestoreSetupState } from "@/components/layout/firestore-setup-state";
import { IntegrationsPanel } from "@/components/integrations/integrations-panel";
import { requireSession } from "@/lib/firebase/auth";
import { getFirestoreSetupMessage, isFirestoreSetupError } from "@/lib/firebase/errors";
import { integrationConfigsRepository, integrationsRepository } from "@/lib/firebase/repositories/integrations";

export default async function IntegrationsPage() {
  const session = await requireSession();
  let integrations = [];
  let googleSheetsConfig = null;
  let configs = [];

  try {
    [integrations, googleSheetsConfig, configs] = await Promise.all([
      integrationsRepository.list(session.uid),
      integrationConfigsRepository.getGoogleSheetsConfig(session.uid),
      integrationConfigsRepository.list(session.uid),
    ]);
  } catch (error) {
    if (isFirestoreSetupError(error)) {
      return (
        <FirestoreSetupState
          title="Firestore integrations are unavailable"
          message={getFirestoreSetupMessage(error)}
        />
      );
    }

    throw error;
  }

  return (
    <IntegrationsPanel
      integrations={integrations}
      googleSheetsConfig={googleSheetsConfig}
      configs={Object.fromEntries(configs.map((config) => [config.provider, config.values]))}
    />
  );
}
