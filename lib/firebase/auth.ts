import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "firebase-admin/auth";

import { SESSION_COOKIE_NAME } from "@/lib/config/constants";
import { getFirebaseAdminApp } from "@/lib/firebase/admin";

export async function createSessionCookie(idToken: string) {
  const auth = getAuth(getFirebaseAdminApp());
  return auth.createSessionCookie(idToken, { expiresIn: 1000 * 60 * 60 * 24 * 5 });
}

export async function verifySessionCookie(sessionCookie: string) {
  const auth = getAuth(getFirebaseAdminApp());
  return auth.verifySessionCookie(sessionCookie, true);
}

export async function requireSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  try {
    return await verifySessionCookie(sessionCookie);
  } catch {
    redirect("/login");
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    return await verifySessionCookie(sessionCookie);
  } catch {
    return null;
  }
}
