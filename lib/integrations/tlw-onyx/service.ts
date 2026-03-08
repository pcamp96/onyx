import { integrationConfigsRepository } from "@/lib/firebase/repositories/integrations";
import { secretsRepository } from "@/lib/firebase/repositories/secrets";
import { decryptIntegrationSecret } from "@/lib/security/secrets";
import { createTlwOnyxClient } from "@/lib/integrations/tlw-onyx/client";

export async function getTlwOnyxClientForUser(userId: string) {
  const [configRecord, secretRecord] = await Promise.all([
    integrationConfigsRepository.get(userId, "tlw-onyx"),
    secretsRepository.get(userId, "tlw-onyx"),
  ]);

  const secret = secretRecord ? await decryptIntegrationSecret("tlw-onyx", secretRecord, userId) : null;

  return createTlwOnyxClient({
    baseUrl: typeof configRecord?.values.baseUrl === "string" ? configRecord.values.baseUrl : undefined,
    secret,
  });
}
