import { getTodayPlan } from "@/lib/planner/service";
import { requireApiSession } from "@/lib/utils/auth";
import { ok, unauthorized } from "@/lib/utils/http";

export async function GET() {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const result = await getTodayPlan(new Date(), session.uid);
  return ok(result);
}
