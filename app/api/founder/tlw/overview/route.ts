import { NextRequest, NextResponse } from "next/server";

import { getErrorStatus, IntegrationRequestError } from "@/lib/integrations/errors";
import { getTlwOnyxClientForUser } from "@/lib/integrations/tlw-onyx/service";
import { requireFounderApiAccess } from "@/lib/utils/auth";
import { ok, serverError, unauthorized } from "@/lib/utils/http";

function parseWindowDays(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("window_days");
  if (!raw) {
    return 7;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 90) {
    throw new IntegrationRequestError("window_days must be an integer between 1 and 90", 400);
  }

  return value;
}

export async function GET(request: NextRequest) {
  const session = await requireFounderApiAccess(request);
  if (!session) {
    return unauthorized();
  }

  try {
    const client = await getTlwOnyxClientForUser(session.uid);
    const windowDays = parseWindowDays(request);
    return ok(await client.getOverview(windowDays));
  } catch (error) {
    const message = error instanceof Error ? error.message : "TLW overview request failed";
    const status = getErrorStatus(error);
    if (status >= 500) {
      return serverError(message);
    }

    return NextResponse.json({ error: message }, { status });
  }
}
