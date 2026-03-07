import { FOUNDER_USER_ID } from "@/lib/config/constants";
import { planningSnapshotsRepository } from "@/lib/firebase/repositories/planning-snapshots";
import { requireApiSession } from "@/lib/utils/auth";
import { ok, unauthorized } from "@/lib/utils/http";

export async function GET() {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const snapshot = await planningSnapshotsRepository.getLatest(FOUNDER_USER_ID, "today");
  return ok(snapshot);
}
