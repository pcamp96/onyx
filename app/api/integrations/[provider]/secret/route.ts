import { NextRequest } from "next/server";

import type { IntegrationProvider } from "@/lib/core/types";
import { secretsRepository } from "@/lib/firebase/repositories/secrets";
import { encryptIntegrationSecret } from "@/lib/security/secrets";
import { requireApiSession } from "@/lib/utils/auth";
import { badRequest, ok, unauthorized } from "@/lib/utils/http";

export async function POST(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const session = await requireApiSession();
  if (!session) {
    return unauthorized();
  }

  const body = (await request.json()) as { secret?: string };
  if (!body.secret) {
    return badRequest("Secret is required");
  }

  const provider = (await context.params).provider as IntegrationProvider;
  const encrypted = await encryptIntegrationSecret(provider, body.secret, session.uid);
  await secretsRepository.save(provider, {
    ...encrypted,
    updatedBy: session.uid,
  });

  return ok({ message: "Secret stored securely" });
}
