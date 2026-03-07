import { IntegrationsPanel } from "@/components/integrations/integrations-panel";
import { FOUNDER_USER_ID } from "@/lib/config/constants";
import { googleSheetConfigRepository, integrationsRepository } from "@/lib/firebase/repositories/integrations";

export default async function IntegrationsPage() {
  const [integrations, googleSheetsConfig] = await Promise.all([
    integrationsRepository.list(),
    googleSheetConfigRepository.get(FOUNDER_USER_ID),
  ]);

  return <IntegrationsPanel integrations={integrations} googleSheetsConfig={googleSheetsConfig} />;
}
