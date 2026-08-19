import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js 16 renamed the middleware.ts convention to proxy.ts (same
// functionality, different name/export — Proxy now also defaults to the
// Node.js runtime rather than Edge).
const { auth } = NextAuth(authConfig);
export default auth;

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*"],
};
