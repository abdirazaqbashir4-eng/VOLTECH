import type { NextAuthConfig } from "next-auth";

// Edge-safe config for middleware.ts. See apps/customer/src/auth.config.ts
// for why this is split from src/auth.ts.
//
// Admin Dashboard: no public registration by design (admin accounts are
// created deliberately via the seed/ops process, never self-serve) — every
// route requires role ADMIN or SUPER_ADMIN except /login itself.
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
    sessionToken: { name: "voltech-admin.session-token" },
    callbackUrl: { name: "voltech-admin.callback-url" },
    csrfToken: { name: "voltech-admin.csrf-token" },
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname === "/login") return true;
      return auth?.user?.role === "ADMIN" || auth?.user?.role === "SUPER_ADMIN";
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
