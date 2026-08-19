import type { NextAuthConfig } from "next-auth";

// Edge-safe config for middleware.ts. See apps/customer/src/auth.config.ts
// for why this is split from src/auth.ts.
//
// This is the Seller Center: every route is seller-only except the public
// onboarding pages (apply/login/register), which anyone can reach to start
// a seller application.
const PUBLIC_PATHS = ["/login", "/register", "/apply"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  // Required outside Vercel (Render, Railway, Fly, etc.).
  trustHost: true,
  // See apps/customer/src/auth.config.ts for why these are app-specific:
  // localhost cookies aren't port-scoped, so the three VOLTECH apps would
  // otherwise clobber each other's session cookie in local dev.
  cookies: {
    sessionToken: { name: "voltech-seller.session-token" },
    callbackUrl: { name: "voltech-seller.callback-url" },
    csrfToken: { name: "voltech-seller.csrf-token" },
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
      return auth?.user?.role === "SELLER";
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as (typeof session.user)["role"];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
