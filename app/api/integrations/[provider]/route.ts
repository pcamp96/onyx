import { NextRequest } from "next/server";

import { FOUNDER_USER_ID } from "@/lib/config/constants";
import type { IntegrationProvider } from "@/lib/core/types";
import { googleSheetConfigRepository, integrationsRepository } from "@/lib/firebase/repositories/integrations";
import { requireApiSession } from "@/lib/utils/auth";
import { ok, unauthorized } from "@/lib/utils/http";

function getProvider(params: Promise<{ provider: string }>) {
  return params.then(({ provider }) => provider as IntegrationProvider);
}

export async function GET(_request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const provider = await getProvider(context.params);
  const integration = await integrationsRepository.get(provider);
  return ok(integration);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const provider = await getProvider(context.params);
  const body = await request.json();

  if (provider === "google-sheets" && body.googleSheetConfig) {
    const googleSheetConfig = await googleSheetConfigRepository.save(FOUNDER_USER_ID, {
      ...body.googleSheetConfig,
      updatedBy: session.uid,
    });
    const integration = await integrationsRepository.save(provider, {
      updatedBy: session.uid,
      enabled: true,
      status: "connected",
    });

    return ok({ integration, googleSheetConfig });
  }

  const integration = await integrationsRepository.save(provider, {
    ...body,
    updatedBy: session.uid,
  });
  return ok(integration);
}
