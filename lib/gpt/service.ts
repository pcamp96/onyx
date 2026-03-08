import { gptApiCredentialsRepository } from "@/lib/firebase/repositories/gpt-api-credentials";
import { gptSetupPreferencesRepository } from "@/lib/firebase/repositories/gpt-setup-preferences";
import { plannerSettingsRepository } from "@/lib/firebase/repositories/planner-settings";
import { usersRepository } from "@/lib/firebase/repositories/users";
import { issueGptCredential, revokeGptCredential } from "@/lib/gpt/credentials";
import { buildGptSetupData } from "@/lib/gpt/setup";

export async function getGptSetupData(userId: string) {
  const [credential, settings, user] = await Promise.all([
    gptApiCredentialsRepository.ensureLookup(userId),
    plannerSettingsRepository.get(userId),
    usersRepository.get(userId),
  ]);
  const displayName = user?.displayName || user?.email || undefined;
  const preferences = await gptSetupPreferencesRepository.get(userId, displayName);

  return buildGptSetupData({
    credential,
    settings,
    preferences,
  });
}

export async function saveGptSetupPreferences(
  userId: string,
  input: Parameters<typeof gptSetupPreferencesRepository.save>[1],
) {
  const user = await usersRepository.get(userId);
  const displayName = user?.displayName || user?.email || undefined;

  await gptSetupPreferencesRepository.save(userId, input, displayName);
  return getGptSetupData(userId);
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
