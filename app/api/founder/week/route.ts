import { getWeekPlan } from "@/lib/planner/service";
import { requireApiSession } from "@/lib/utils/auth";
import { ok, unauthorized } from "@/lib/utils/http";

export async function GET() {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const result = await getWeekPlan(new Date(), session.uid);
  return ok(result);
}
