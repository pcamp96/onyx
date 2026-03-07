import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/core/constants";

const PUBLIC_PATHS = ["/login", "/health", "/api/auth/session", "/api/auth/logout", "/api/openapi.json", "/api/openapi.yaml"];
const TOKEN_AUTH_API_PATHS = ["/api/founder/today", "/api/founder/week", "/api/founder/capture"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isPublic) {
    return NextResponse.next();
  }

  const isTokenAuthApi = TOKEN_AUTH_API_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (isTokenAuthApi) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/overview") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/integrations") ||
    pathname.startsWith("/debug") ||
    pathname.startsWith("/gpt-setup")
  ) {
    const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
    if (!hasSession) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
