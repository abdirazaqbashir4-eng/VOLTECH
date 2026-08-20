import "server-only";
import { cookies } from "next/headers";
import { verifySessionCookie, revokeUserSessions } from "@voltech/core/firebase-admin";
import type { UserRole } from "@voltech/core/enums";

// All three VOLTECH apps run on localhost with different ports in dev, and
// cookies aren't port-scoped — a distinct name per app keeps sessions from
// clobbering each other (same reasoning the old NextAuth setup used).
export const SESSION_COOKIE_NAME = "voltech-customer-session";

export interface Session {
  user: {
    id: string;
    role: UserRole;
    name: string;
    email: string;
  };
}

/** Buyer marketplace: this is the same shape the app used with NextAuth (`session.user.id/role/name/email`), so no page code needed to change. */
export async function auth(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return null;

  const decoded = await verifySessionCookie(cookieValue);
  if (!decoded) return null;

  return {
    user: {
      id: decoded.appUserId,
      role: decoded.role,
      name: decoded.name ?? "",
      email: decoded.email ?? "",
    },
  };
}

export async function signOut({ redirectTo = "/" }: { redirectTo?: string } = {}) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  cookieStore.delete(SESSION_COOKIE_NAME);
  if (cookieValue) {
    const decoded = await verifySessionCookie(cookieValue);
    if (decoded) await revokeUserSessions(decoded.uid).catch(() => {});
  }
  const { redirect } = await import("next/navigation");
  redirect(redirectTo);
}
