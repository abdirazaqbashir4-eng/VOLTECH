import { NextResponse, type NextRequest } from "next/server";
import { verifySessionCookie } from "@voltech/core/firebase-admin";
import { SESSION_COOKIE_NAME } from "@/auth";

// No public registration by design — every route requires role ADMIN or
// SUPER_ADMIN except /login itself and the session-exchange route it calls.
const PUBLIC_PATHS = ["/login", "/api/session"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = cookieValue ? await verifySessionCookie(cookieValue) : null;

  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
