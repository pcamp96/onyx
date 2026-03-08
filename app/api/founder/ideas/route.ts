import { NextRequest } from "next/server";

import { toIdeasApiResult } from "@/lib/planner/serializers";
import { getIdeasPlan } from "@/lib/planner/service";
import { requireFounderApiAccess } from "@/lib/utils/auth";
import { ok, unauthorized } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  const session = await requireFounderApiAccess(request);
  if (!session) {
    return unauthorized();
  }

  const result = await getIdeasPlan(new Date(), session.uid);
  return ok(toIdeasApiResult(result));
}
