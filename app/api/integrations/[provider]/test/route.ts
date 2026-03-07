import type { IntegrationProvider } from "@/lib/core/types";
import { FOUNDER_USER_ID } from "@/lib/config/constants";
import { googleSheetConfigRepository, integrationsRepository } from "@/lib/firebase/repositories/integrations";
import { secretsRepository } from "@/lib/firebase/repositories/secrets";
import { getIntegrationAdapter } from "@/lib/integrations/registry";
import { decryptIntegrationSecret } from "@/lib/security/secrets";
import { requireApiSession } from "@/lib/utils/auth";
import { ok, serverError, unauthorized } from "@/lib/utils/http";

async function getConfig(provider: IntegrationProvider) {
  if (provider === "google-sheets") {
    return (await googleSheetConfigRepository.get(FOUNDER_USER_ID)) as unknown as Record<string, unknown> | null;
  }

  return (await integrationsRepository.get(provider)) as unknown as Record<string, unknown>;
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
      getConfig(provider),
      secretsRepository.get(provider),
    ]);
    const secret = secretRecord ? await decryptIntegrationSecret(provider, secretRecord, FOUNDER_USER_ID) : null;
    const result = await adapter.testConnection({
      userId: FOUNDER_USER_ID,
      config,
      secret,
      now: new Date(),
    });

    await integrationsRepository.save(provider, {
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
