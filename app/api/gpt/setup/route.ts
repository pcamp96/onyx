import { NextRequest } from "next/server";

import { getGptSetupData, saveGptSetupPreferences } from "@/lib/gpt/service";
import { requireApiSession } from "@/lib/utils/auth";
import { ok, unauthorized } from "@/lib/utils/http";

export async function GET() {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  return ok(await getGptSetupData(session.uid));
}

export async function PUT(request: NextRequest) {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const body = await request.json();
  const setup = await saveGptSetupPreferences(session.uid, {
    ...body,
    updatedBy: session.uid,
  });

  return ok(setup);
}
