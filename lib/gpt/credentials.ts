import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getServerEnv } from "@/lib/config/env";
import { gptApiCredentialsRepository } from "@/lib/firebase/repositories/gpt-api-credentials";
import type { GptApiCredentialRecord } from "@/lib/gpt/types";

const GPT_TOKEN_PREFIX = "onyx_gpt_";
const DEFAULT_LABEL = "Custom GPT";

function getTokenSecret() {
  return getServerEnv().ONYX_ENCRYPTION_KEY;
}

export function createGptApiToken() {
  return `${GPT_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export function hashGptApiToken(token: string) {
  return createHmac("sha256", getTokenSecret()).update(token).digest("hex");
}

export function getTokenLastFour(token: string) {
  return token.slice(-4);
}

export function verifyGptApiToken(candidate: string, tokenHash: string) {
  const candidateHash = hashGptApiToken(candidate);
  return timingSafeEqual(Buffer.from(candidateHash, "utf8"), Buffer.from(tokenHash, "utf8"));
}

export async function issueGptCredential(userId: string, updatedBy: string, label = DEFAULT_LABEL) {
  const token = createGptApiToken();
  const record = await gptApiCredentialsRepository.save(userId, {
    label,
    tokenHash: hashGptApiToken(token),
    tokenLastFour: getTokenLastFour(token),
    status: "active",
    updatedBy,
    revokedAt: undefined,
    lastUsedAt: undefined,
  });

  return { record, token };
}

export async function revokeGptCredential(userId: string, updatedBy: string) {
  return gptApiCredentialsRepository.revoke(userId, updatedBy);
}

export async function authenticateGptApiToken(token: string): Promise<GptApiCredentialRecord | null> {
  if (!token.startsWith(GPT_TOKEN_PREFIX)) {
    return null;
  }

  const record = await gptApiCredentialsRepository.findByTokenHash(hashGptApiToken(token));
  if (!record || record.status !== "active" || !verifyGptApiToken(token, record.tokenHash)) {
    return null;
  }

  void gptApiCredentialsRepository.touchLastUsed(record.userId).catch(() => undefined);
  return record;
}
