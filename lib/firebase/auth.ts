import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodeProtectedHeader, importX509, jwtVerify, type JWTPayload } from "jose";

import { SESSION_COOKIE_NAME } from "@/lib/core/constants";
import { getServerEnv } from "@/lib/config/env";

const FIREBASE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

type SessionUser = {
  uid: string;
  email: string;
};

type CertCache = {
  expiresAt: number;
  keys: Map<string, Promise<CryptoKey>>;
};

let certCache: CertCache | null = null;

function parseMaxAge(header: string | null) {
  if (!header) {
    return 60 * 60;
  }

  const match = header.match(/max-age=(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : 60 * 60;
}

async function getFirebasePublicKeys() {
  const now = Date.now();
  if (certCache && certCache.expiresAt > now) {
    return certCache.keys;
  }

  const response = await fetch(FIREBASE_CERTS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Firebase public keys (${response.status})`);
  }

  const certs = (await response.json()) as Record<string, string>;
  const maxAgeSeconds = parseMaxAge(response.headers.get("cache-control"));
  const keys = new Map<string, Promise<CryptoKey>>();

  for (const [kid, cert] of Object.entries(certs)) {
    keys.set(kid, importX509(cert, "RS256"));
  }

  certCache = {
    expiresAt: now + maxAgeSeconds * 1000,
    keys,
  };

  return keys;
}

async function verifyFirebaseIdToken(token: string): Promise<JWTPayload> {
  const env = getServerEnv();
  const { kid } = decodeProtectedHeader(token);

  if (!kid) {
    throw new Error("Firebase token missing kid");
  }

  const keys = await getFirebasePublicKeys();
  const key = keys.get(kid);
  if (!key) {
    throw new Error("Firebase token used an unknown signing key");
  }

  const verified = await jwtVerify(token, await key, {
    audience: env.FIREBASE_PROJECT_ID,
    issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
  });

  return verified.payload;
}

function toSessionUser(payload: JWTPayload): SessionUser {
  if (!payload.sub) {
    throw new Error("Firebase token missing subject");
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : "",
  };
}

export async function createSessionCookie(idToken: string) {
  const payload = await verifyFirebaseIdToken(idToken);
  const expiresAt = typeof payload.exp === "number" ? payload.exp * 1000 : Date.now() + 60 * 60 * 1000;
  const maxAge = Math.max(60, Math.floor((expiresAt - Date.now()) / 1000));

  return {
    value: idToken,
    maxAge,
  };
}

export async function verifySessionCookie(sessionCookie: string) {
  const payload = await verifyFirebaseIdToken(sessionCookie);
  return toSessionUser(payload);
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
