import { NextResponse, type NextRequest } from "next/server";
import { verifySessionCookie } from "@voltech/core/firebase-admin";
import { SESSION_COOKIE_NAME } from "@/auth";

// Next.js 16 renamed the middleware.ts convention to proxy.ts — same
// functionality, and (unlike the old Edge-runtime middleware) this always
// runs on the Node.js runtime, so it's fine to call the Admin SDK here
// directly rather than needing an edge-safe subset of the auth config.
export default async function proxy(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = cookieValue ? await verifySessionCookie(cookieValue) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*"],
};
