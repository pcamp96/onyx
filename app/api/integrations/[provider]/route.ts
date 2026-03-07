import { NextRequest } from "next/server";

import type { GoogleSheetConfig, IntegrationProvider } from "@/lib/core/types";
import { integrationConfigsRepository, integrationsRepository } from "@/lib/firebase/repositories/integrations";
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
  const [integration, config] = await Promise.all([
    integrationsRepository.get(session.uid, provider),
    integrationConfigsRepository.get(session.uid, provider),
  ]);

  return ok({
    integration,
    config: config?.values ?? null,
  });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const provider = await getProvider(context.params);
  const body = await request.json();

  if (provider === "google-sheets" && body.googleSheetConfig) {
    const googleSheetConfig = body.googleSheetConfig as GoogleSheetConfig;
    const [integration, config] = await Promise.all([
      integrationsRepository.save(session.uid, provider, {
        updatedBy: session.uid,
        enabled: true,
        status: "connected",
      }),
      integrationConfigsRepository.save(session.uid, provider, googleSheetConfig as unknown as Record<string, unknown>, session.uid),
    ]);

    return ok({ integration, config: config.values });
  }

  const { config, ...integrationInput } = body as { config?: Record<string, unknown> } & Record<string, unknown>;
  const integration = await integrationsRepository.save(session.uid, provider, {
    ...integrationInput,
    updatedBy: session.uid,
  });

  if (!config) {
    return ok({ integration, config: null });
  }

  const savedConfig = await integrationConfigsRepository.save(session.uid, provider, config, session.uid);
  return ok({ integration, config: savedConfig.values });
}
