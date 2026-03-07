import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/config/constants";
import { getSessionUser } from "@/lib/firebase/auth";

export async function requireApiSession() {
  const session = await getSessionUser();
  if (!session) {
    return null;
  }

  return session;
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
