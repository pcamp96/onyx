import { NextRequest } from "next/server";

import { FOUNDER_USER_ID } from "@/lib/config/constants";
import { plannerSettingsRepository } from "@/lib/firebase/repositories/planner-settings";
import { requireApiSession } from "@/lib/utils/auth";
import { ok, unauthorized } from "@/lib/utils/http";

export async function GET() {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const settings = await plannerSettingsRepository.get(FOUNDER_USER_ID);
  return ok(settings);
}

export async function PUT(request: NextRequest) {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const body = await request.json();
  const settings = await plannerSettingsRepository.save(FOUNDER_USER_ID, {
    ...body,
    updatedBy: session.uid,
  });

  return ok(settings);
}
