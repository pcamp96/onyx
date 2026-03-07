import { SettingsForm } from "@/components/settings/settings-form";
import { FOUNDER_USER_ID } from "@/lib/config/constants";
import { plannerSettingsRepository } from "@/lib/firebase/repositories/planner-settings";

export default async function SettingsPage() {
  const settings = await plannerSettingsRepository.get(FOUNDER_USER_ID);

  return <SettingsForm initialSettings={settings} />;
}
