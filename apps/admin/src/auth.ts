import "server-only";
import { cookies } from "next/headers";
import { verifySessionCookie, revokeUserSessions } from "@voltech/core/firebase-admin";
import type { UserRole } from "@voltech/core/enums";

export const SESSION_COOKIE_NAME = "voltech-admin-session";

export interface Session {
  user: {
    id: string;
    role: UserRole;
    name: string;
    email: string;
  };
}

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

export async function signOut({ redirectTo = "/login" }: { redirectTo?: string } = {}) {
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
