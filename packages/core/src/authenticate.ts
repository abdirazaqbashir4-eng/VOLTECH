import { db } from "@voltech/database";
import { verifyPassword } from "./password";
import type { UserRole } from "./enums";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Shared credentials check used by every app's NextAuth Credentials
 * provider. `allowedRoles`, when given, rejects a login attempt from an
 * account of the wrong kind at the source — e.g. the seller site refuses a
 * plain customer account, the admin site refuses everyone but admins —
 * instead of authenticating them and only then hiding pages via middleware.
 */
export async function authenticateCredentials(
  email: string,
  password: string,
  allowedRoles?: UserRole[],
): Promise<AuthenticatedUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return null;
  if (user.status !== "ACTIVE") return null;
  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.fullName, role: user.role as UserRole };
}
