import { planningDebugRepository, planningSnapshotsRepository } from "@/lib/firebase/repositories/planning-snapshots";
import { requireApiSession } from "@/lib/utils/auth";
import { ok, unauthorized } from "@/lib/utils/http";

export async function GET() {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const [snapshot, debug] = await Promise.all([
    planningSnapshotsRepository.getLatest(session.uid, "week"),
    planningDebugRepository.get(session.uid, "week"),
  ]);
  return ok({ snapshot, debug });
}
