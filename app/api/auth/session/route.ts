import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/core/constants";
import { createSessionCookie } from "@/lib/firebase/auth";
import { badRequest, ok, serverError } from "@/lib/utils/http";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { idToken?: string };
    if (!body.idToken) {
      return badRequest("Missing Firebase ID token");
    }

    const sessionCookie = await createSessionCookie(body.idToken);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionCookie.maxAge,
    });

    return ok({ message: "Session created" });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Failed to create session");
  }
}
