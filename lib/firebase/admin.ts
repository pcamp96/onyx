import { importPKCS8, SignJWT } from "jose";

import { getServerEnv } from "@/lib/config/env";

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

type AccessTokenRecord = {
  accessToken: string;
  expiresAt: number;
};

const tokenCache = new Map<string, AccessTokenRecord>();

function getServiceAccountPrivateKey() {
  return getServerEnv().FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
}

function getScopeKey(scopes: string[]) {
  return [...scopes].sort().join(" ");
}

async function createServiceAccountAssertion(scopes: string[]) {
  const env = getServerEnv();
  const privateKey = await importPKCS8(getServiceAccountPrivateKey(), "RS256");

  return new SignJWT({
    scope: scopes.join(" "),
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(env.FIREBASE_CLIENT_EMAIL)
    .setSubject(env.FIREBASE_CLIENT_EMAIL)
    .setAudience(GOOGLE_OAUTH_TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime("55m")
    .sign(privateKey);
}

export async function getGoogleAccessToken(scopes: string[]) {
  const scopeKey = getScopeKey(scopes);
  const cached = tokenCache.get(scopeKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60_000) {
    return cached.accessToken;
  }

  const assertion = await createServiceAccountAssertion(scopes);
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Google access token (${response.status})`);
  }

  const payload = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache.set(scopeKey, {
    accessToken: payload.access_token,
    expiresAt: now + payload.expires_in * 1000,
  });

  return payload.access_token;
}
