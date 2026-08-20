import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import type { UserRole } from "./enums";

// Reused across hot-reloads and across the three apps' server processes,
// same rationale as the PrismaClient singleton in @voltech/database.
const globalForFirebase = globalThis as unknown as { voltechFirebaseApp?: App };

function getFirebaseApp(): App {
  if (globalForFirebase.voltechFirebaseApp) return globalForFirebase.voltechFirebaseApp;

  const { projectId, clientEmail, privateKey } = resolveCredentials();

  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  globalForFirebase.voltechFirebaseApp = app;
  return app;
}

/**
 * Two ways to configure the Admin SDK credential, tried in this order:
 *
 * 1. FIREBASE_SERVICE_ACCOUNT_BASE64 — the *entire* service-account JSON
 *    file, base64-encoded, as one env var. Preferred: base64 output is a
 *    single line of plain alphanumeric characters (plus +/=), so there's
 *    nothing for a dashboard's env-var text box to mangle — no newlines to
 *    collapse, no quotes to strip, no marker line to accidentally drop.
 *    Generate it with (PowerShell):
 *      [Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json"))
 *    or (bash): base64 -w0 service-account.json
 *
 * 2. FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY —
 *    the three fields set separately. Kept as a fallback for anyone who's
 *    already set these up, but the private key is a multiline PEM value,
 *    which is exactly the kind of thing dashboard paste boxes tend to
 *    corrupt (missing BEGIN/END markers, dropped newlines, wrapped-in-
 *    quotes) — prefer option 1 when setting this up fresh.
 */
function resolveCredentials(): { projectId: string; clientEmail: string; privateKey: string } {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (encoded) {
    let parsed: { project_id?: string; client_email?: string; private_key?: string };
    try {
      parsed = JSON.parse(Buffer.from(encoded.trim(), "base64").toString("utf8"));
    } catch (err) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_BASE64 isn't valid base64-encoded JSON (${(err as Error).message}). Regenerate it from the full service-account JSON file.`,
      );
    }
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      const missing = [
        !parsed.project_id && "project_id",
        !parsed.client_email && "client_email",
        !parsed.private_key && "private_key",
      ].filter(Boolean);
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_BASE64 decoded to JSON missing field(s): ${missing.join(", ")}.`);
    }
    return { projectId: parsed.project_id, clientEmail: parsed.client_email, privateKey: normalizePrivateKey(parsed.private_key) };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    const missing = [
      !projectId && "FIREBASE_PROJECT_ID",
      !clientEmail && "FIREBASE_CLIENT_EMAIL",
      !privateKey && "FIREBASE_PRIVATE_KEY",
    ].filter(Boolean);
    throw new Error(
      `Missing env var(s): ${missing.join(", ")} — set FIREBASE_SERVICE_ACCOUNT_BASE64 (recommended) or all three of these, from a Firebase service account key, to verify sessions or manage users.`,
    );
  }
  return { projectId, clientEmail, privateKey: normalizePrivateKey(privateKey) };
}

/**
 * Render (and most platforms) can't store a literal newline in an env var,
 * so the service-account private key is pasted with escaped "\n" sequences
 * and needs unescaping — but dashboard paste boxes also commonly introduce
 * a few other artifacts: wrapping quotes copied along with the JSON string
 * value, Windows-style \r\n, or stray leading/trailing whitespace. Handle
 * all of those, then fail loudly with a specific (non-secret-leaking)
 * message if the result still isn't a well-formed PEM block, rather than
 * letting node's crypto layer fail deep inside with an opaque OpenSSL
 * "DECODER routines::unsupported" error.
 */
function normalizePrivateKey(raw: string): string {
  // Safe diagnostic (structure only, never the key content) — logged to
  // stderr, which is what shows up in Render's log viewer, so the exact
  // shape of what Render is actually injecting is visible without ever
  // printing key material.
  console.error(
    "FIREBASE_PRIVATE_KEY diagnostic:",
    JSON.stringify({
      rawLength: raw.length,
      trimmedLength: raw.trim().length,
      startsWithQuote: raw.trim().startsWith('"') || raw.trim().startsWith("'"),
      endsWithQuote: raw.trim().endsWith('"') || raw.trim().endsWith("'"),
      containsLiteralBackslashN: raw.includes("\\n"),
      containsRealNewline: raw.includes("\n"),
      containsBeginMarkerRaw: raw.includes("BEGIN PRIVATE KEY"),
      containsEndMarkerRaw: raw.includes("END PRIVATE KEY"),
      // Deliberately no character-content fields (even "first N chars") —
      // in exactly the failure case this diagnostic exists for (a missing
      // BEGIN marker), the leading characters ARE real key material, not
      // boilerplate, so printing any of it would leak actual secret bytes.
    }),
  );

  let key = raw.trim();

  // Strip a single layer of wrapping quotes, if the whole value is quoted
  // (happens when someone copies `"private_key": "...”` including the
  // quote characters rather than just the string's contents).
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  key = key.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();

  const beginMarker = "-----BEGIN PRIVATE KEY-----";
  const endMarker = "-----END PRIVATE KEY-----";
  const hasBegin = key.includes(beginMarker);
  const hasEnd = key.includes(endMarker);
  if (!hasBegin || !hasEnd) {
    throw new Error(
      `FIREBASE_PRIVATE_KEY doesn't look like a complete PEM key (exists=true, length=${key.length}, containsBeginMarker=${hasBegin}, containsEndMarker=${hasEnd}) — re-paste the full "private_key" value from the service account JSON, including both marker lines. See the "FIREBASE_PRIVATE_KEY diagnostic" log line just above this error for more detail on what was actually received.`,
    );
  }

  return key;
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
