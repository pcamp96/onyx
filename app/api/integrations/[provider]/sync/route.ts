import type { IntegrationProvider } from "@/lib/core/types";
import { integrationConfigsRepository, integrationsRepository } from "@/lib/firebase/repositories/integrations";
import { secretsRepository } from "@/lib/firebase/repositories/secrets";
import { getErrorStatus } from "@/lib/integrations/errors";
import { getIntegrationAdapter } from "@/lib/integrations/registry";
import { decryptIntegrationSecret } from "@/lib/security/secrets";
import { requireApiSession } from "@/lib/utils/auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/utils/http";

async function getConfig(userId: string, provider: IntegrationProvider) {
  const config = await integrationConfigsRepository.get(userId, provider);
  return config?.values ?? null;
}

export async function POST(_request: Request, context: { params: Promise<{ provider: string }> }) {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const provider = (await context.params).provider as IntegrationProvider;
    const adapter = await getIntegrationAdapter(provider);
    const [config, secretRecord] = await Promise.all([
      getConfig(session.uid, provider),
      secretsRepository.get(session.uid, provider),
    ]);
    const secret = secretRecord ? await decryptIntegrationSecret(provider, secretRecord, session.uid) : null;
    const result = await adapter.sync({
      userId: session.uid,
      config,
      secret,
      now: new Date(),
    });

    await integrationsRepository.save(session.uid, provider, {
      status: "connected",
      lastSyncAt: new Date().toISOString(),
      lastSyncStatus: "success",
      lastError: "",
      updatedBy: session.uid,
    });

    return ok({
      message: `Synced ${provider}`,
      counts: {
        tasks: result.tasks.length,
        calendarEvents: result.calendarEvents.length,
        articleEntries: result.articleEntries.length,
      },
      preview: result.rawPreview,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return getErrorStatus(error) < 500 ? badRequest(message) : serverError(message);
  }
}
