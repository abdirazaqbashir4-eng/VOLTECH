import { NextResponse, type NextRequest } from "next/server";
import { verifySessionCookie } from "@voltech/core/firebase-admin";
import { SESSION_COOKIE_NAME } from "@/auth";

// Public onboarding pages — anyone can reach these to start a seller
// application — plus the session-exchange route, which is called from the
// login/register pages themselves before any session cookie exists.
// Every other route is seller-only.
const PUBLIC_PATHS = ["/login", "/register", "/apply", "/api/session"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = cookieValue ? await verifySessionCookie(cookieValue) : null;

  if (!session || session.role !== "SELLER") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
