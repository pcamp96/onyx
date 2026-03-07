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
  const apiKey = request.headers.get("x-onyx-api-key")?.trim();
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
