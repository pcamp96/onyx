import { NextRequest, NextResponse } from "next/server";

import { getErrorStatus } from "@/lib/integrations/errors";
import { getTlwOnyxClientForUser } from "@/lib/integrations/tlw-onyx/service";
import { requireFounderApiAccess } from "@/lib/utils/auth";
import { ok, serverError, unauthorized } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  const session = await requireFounderApiAccess(request);
  if (!session) {
    return unauthorized();
  }

  try {
    const client = await getTlwOnyxClientForUser(session.uid);
    return ok(await client.getSnapshot());
  } catch (error) {
    const message = error instanceof Error ? error.message : "TLW snapshot request failed";
    const status = getErrorStatus(error);
    if (status >= 500) {
      return serverError(message);
    }

    return NextResponse.json({ error: message }, { status });
  }
}
