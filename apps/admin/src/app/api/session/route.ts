import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken, createSessionCookie, sessionCookieMaxAgeSeconds } from "@voltech/core/firebase-admin";
import { SESSION_COOKIE_NAME } from "@/auth";

export async function POST(request: Request) {
  const { idToken } = await request.json();
  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    const decoded = await verifyIdToken(idToken);
    // Reject at session-creation time, not just at the proxy — a non-admin
    // should never get a valid admin-app session cookie in the first place.
    if (decoded.role !== "ADMIN" && decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "This account is not an administrator." }, { status: 403 });
    }
    const sessionCookie = await createSessionCookie(idToken);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionCookieMaxAgeSeconds,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not verify sign-in." }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
