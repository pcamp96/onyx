import type { IntegrationProvider } from "@/lib/core/types";
import { integrationConfigsRepository, integrationsRepository } from "@/lib/firebase/repositories/integrations";
import { secretsRepository } from "@/lib/firebase/repositories/secrets";
import { getIntegrationAdapter } from "@/lib/integrations/registry";
import { decryptIntegrationSecret } from "@/lib/security/secrets";
import { requireApiSession } from "@/lib/utils/auth";
import { ok, serverError, unauthorized } from "@/lib/utils/http";

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
    const result = await adapter.testConnection({
      userId: session.uid,
      config,
      secret,
      now: new Date(),
    });

    await integrationsRepository.save(session.uid, provider, {
      status: result.ok ? "connected" : "error",
      lastTestAt: new Date().toISOString(),
      lastTestStatus: result.ok ? "success" : "error",
      lastError: result.ok ? "" : result.message,
      updatedBy: session.uid,
    });

    return ok(result);
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Connection test failed");
  }
}
