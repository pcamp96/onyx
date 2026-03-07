import { gptApiCredentialsRepository } from "@/lib/firebase/repositories/gpt-api-credentials";
import { plannerSettingsRepository } from "@/lib/firebase/repositories/planner-settings";
import { usersRepository } from "@/lib/firebase/repositories/users";
import { issueGptCredential, revokeGptCredential } from "@/lib/gpt/credentials";
import { buildGptSetupData } from "@/lib/gpt/setup";

export async function getGptSetupData(userId: string) {
  const [credential, settings, user] = await Promise.all([
    gptApiCredentialsRepository.get(userId),
    plannerSettingsRepository.get(userId),
    usersRepository.get(userId),
  ]);

  return buildGptSetupData({
    credential,
    settings,
    displayName: user?.displayName || user?.email || undefined,
  });
}

export async function createInitialGptCredential(userId: string) {
  const existing = await gptApiCredentialsRepository.get(userId);
  if (existing?.status === "active") {
    return { record: existing, token: null };
  }

  return issueGptCredential(userId, userId);
}

export async function rotateGptCredential(userId: string) {
  return issueGptCredential(userId, userId);
}

export async function revokeActiveGptCredential(userId: string) {
  return revokeGptCredential(userId, userId);
}
