import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticateCredentials } from "@voltech/core/authenticate";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : undefined;
        const password = typeof credentials?.password === "string" ? credentials.password : undefined;
        if (!email || !password) return null;
        // No role restriction here: a not-yet-approved applicant is still
        // role CUSTOMER and needs to log in to reach /apply. The
        // `authorized` callback in auth.config.ts is what actually gates
        // the seller dashboard to role SELLER.
        return authenticateCredentials(email, password);
      },
    }),
  ],
});
