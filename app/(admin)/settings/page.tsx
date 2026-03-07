import { SettingsForm } from "@/components/settings/settings-form";
import { requireSession } from "@/lib/firebase/auth";
import { plannerSettingsRepository } from "@/lib/firebase/repositories/planner-settings";

export default async function SettingsPage() {
  const session = await requireSession();
  const settings = await plannerSettingsRepository.get(session.uid);

  return <SettingsForm initialSettings={settings} />;
}
