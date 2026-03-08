import { NextRequest } from "next/server";

import { toTodayApiResult } from "@/lib/planner/serializers";
import { getTodayPlan } from "@/lib/planner/service";
import { requireFounderApiAccess } from "@/lib/utils/auth";
import { ok, unauthorized } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  const session = await requireFounderApiAccess(request);
  if (!session) {
    return unauthorized();
  }

  const result = await getTodayPlan(new Date(), session.uid);
  return ok(toTodayApiResult(result));
}
