import { IntegrationsPanel } from "@/components/integrations/integrations-panel";
import { requireSession } from "@/lib/firebase/auth";
import { integrationConfigsRepository, integrationsRepository } from "@/lib/firebase/repositories/integrations";

export default async function IntegrationsPage() {
  const session = await requireSession();
  const [integrations, googleSheetsConfig, configs] = await Promise.all([
    integrationsRepository.list(session.uid),
    integrationConfigsRepository.getGoogleSheetsConfig(session.uid),
    integrationConfigsRepository.list(session.uid),
  ]);

  return (
    <IntegrationsPanel
      integrations={integrations}
      googleSheetsConfig={googleSheetsConfig}
      configs={Object.fromEntries(configs.map((config) => [config.provider, config.values]))}
    />
  );
}
