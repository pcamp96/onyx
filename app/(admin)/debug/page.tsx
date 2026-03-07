import { DebugPanel } from "@/components/debug/debug-panel";
import { FOUNDER_USER_ID } from "@/lib/config/constants";
import { planningSnapshotsRepository } from "@/lib/firebase/repositories/planning-snapshots";

export default async function DebugPage() {
  const [today, week] = await Promise.all([
    planningSnapshotsRepository.getLatest(FOUNDER_USER_ID, "today"),
    planningSnapshotsRepository.getLatest(FOUNDER_USER_ID, "week"),
  ]);

  return <DebugPanel today={today} week={week} />;
}
