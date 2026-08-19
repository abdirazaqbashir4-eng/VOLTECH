import type { NextAuthConfig } from "next-auth";

// Edge-safe config used by proxy.ts (Edge runtime — cannot load the `pg`
// driver used by @voltech/database). The Credentials provider that touches
// the database is added on top of this in src/auth.ts, which only ever runs
// in Node.js route handlers / server components.
//
// This is the buyer marketplace: any authenticated account (customer,
// seller, or admin browsing as a shopper) may use /account and /checkout —
// this site does not gate by role, unlike the seller and admin sites.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  // Required outside Vercel (Render, Railway, Fly, etc.) — Auth.js only
  // auto-trusts the request Host header on Vercel by default.
  trustHost: true,
  // All three VOLTECH apps run on localhost with different ports in dev.
  // Cookies are scoped by domain, not port, so without app-specific cookie
  // names, signing into one app silently overwrites another's session
  // cookie. Distinct names keep the three sessions independent.
  cookies: {
    sessionToken: { name: "voltech-customer.session-token" },
    callbackUrl: { name: "voltech-customer.callback-url" },
    csrfToken: { name: "voltech-customer.csrf-token" },
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected = pathname.startsWith("/account") || pathname.startsWith("/checkout");
      if (isProtected) return !!auth;
      return true;
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
