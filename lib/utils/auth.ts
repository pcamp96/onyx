import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/core/constants";
import { getSessionUser } from "@/lib/firebase/auth";
import { authenticateGptApiToken } from "@/lib/gpt/credentials";

export async function requireApiSession() {
  const session = await getSessionUser();
  if (!session) {
    return null;
  }

  return session;
}

export async function requireFounderApiAccess(request: NextRequest) {
  const apiKey = getFounderApiKeyFromRequest(request);
  if (apiKey) {
    const credential = await authenticateGptApiToken(apiKey);
    if (credential) {
      return {
        uid: credential.userId,
        authMethod: "gpt_api_key" as const,
      };
    }
  }

  const session = await getSessionUser();
  if (!session) {
    return null;
  }

  return {
    uid: session.uid,
    email: session.email,
    authMethod: "session" as const,
  };
}

function getFounderApiKeyFromRequest(request: NextRequest) {
  const legacyHeader = request.headers.get("x-onyx-api-key")?.trim();
  if (legacyHeader) {
    return legacyHeader;
  }

  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) {
    return null;
  }

  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) {
    return bearerMatch[1]?.trim() ?? null;
  }

  return authorization;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
