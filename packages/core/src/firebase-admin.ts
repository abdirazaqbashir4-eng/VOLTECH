import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import type { UserRole } from "./enums";

// Reused across hot-reloads and across the three apps' server processes,
// same rationale as the PrismaClient singleton in @voltech/database.
const globalForFirebase = globalThis as unknown as { voltechFirebaseApp?: App };

function getFirebaseApp(): App {
  if (globalForFirebase.voltechFirebaseApp) return globalForFirebase.voltechFirebaseApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be set (from a Firebase service account key) to verify sessions or manage users.",
    );
  }

  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // Render (and most platforms) can't store a literal newline in an
        // env var — the key is set with escaped "\n" sequences and unescaped
        // here.
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  globalForFirebase.voltechFirebaseApp = app;
  return app;
}

export interface AppClaims {
  role: UserRole;
  appUserId: string;
}

const SESSION_COOKIE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/** Verifies an ID token from the client SDK (used once, at session-exchange time). */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  return getAuth(getFirebaseApp()).verifyIdToken(idToken);
}

/** Mints an HttpOnly session cookie value from a freshly-verified ID token. */
export async function createSessionCookie(idToken: string): Promise<string> {
  return getAuth(getFirebaseApp()).createSessionCookie(idToken, { expiresIn: SESSION_COOKIE_MAX_AGE_MS });
}

export const sessionCookieMaxAgeSeconds = SESSION_COOKIE_MAX_AGE_MS / 1000;

/**
 * Verifies a session cookie (read on every `auth()` call / proxy request).
 * Returns null instead of throwing on an invalid/expired/revoked cookie —
 * callers treat that identically to "not logged in".
 */
export async function verifySessionCookie(
  cookieValue: string,
): Promise<(DecodedIdToken & AppClaims) | null> {
  try {
    const decoded = await getAuth(getFirebaseApp()).verifySessionCookie(cookieValue, true);
    if (!decoded.role || !decoded.appUserId) return null;
    return decoded as DecodedIdToken & AppClaims;
  } catch {
    return null;
  }
}

export async function createFirebaseUser(params: { email: string; password: string; displayName: string }) {
  return getAuth(getFirebaseApp()).createUser({
    email: params.email,
    password: params.password,
    displayName: params.displayName,
  });
}

/** Idempotent version of createFirebaseUser — for the seed script, which is meant to be safe to re-run. */
export async function getOrCreateFirebaseUser(params: { email: string; password: string; displayName: string }) {
  try {
    return await getAuth(getFirebaseApp()).getUserByEmail(params.email);
  } catch {
    return createFirebaseUser(params);
  }
}

export async function setUserRoleClaims(uid: string, claims: AppClaims): Promise<void> {
  await getAuth(getFirebaseApp()).setCustomUserClaims(uid, claims);
}

/** Used after registration: lets the client exchange this for an ID token via signInWithCustomToken. */
export async function createCustomToken(uid: string): Promise<string> {
  return getAuth(getFirebaseApp()).createCustomToken(uid);
}

export async function revokeUserSessions(uid: string): Promise<void> {
  await getAuth(getFirebaseApp()).revokeRefreshTokens(uid);
}

export async function deleteFirebaseUser(uid: string): Promise<void> {
  await getAuth(getFirebaseApp()).deleteUser(uid);
}
