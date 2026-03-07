import { NextRequest } from "next/server";

import { plannerSettingsRepository } from "@/lib/firebase/repositories/planner-settings";
import { requireApiSession } from "@/lib/utils/auth";
import { ok, unauthorized } from "@/lib/utils/http";

export async function GET() {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const settings = await plannerSettingsRepository.get(session.uid);
  return ok(settings);
}

export async function PUT(request: NextRequest) {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const body = await request.json();
  const settings = await plannerSettingsRepository.save(session.uid, {
    ...body,
    updatedBy: session.uid,
  });

  return ok(settings);
}
