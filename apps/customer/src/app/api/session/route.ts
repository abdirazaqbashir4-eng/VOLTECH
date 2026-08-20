import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken, createSessionCookie, sessionCookieMaxAgeSeconds } from "@voltech/core/firebase-admin";
import { SESSION_COOKIE_NAME } from "@/auth";

// Client SDK sign-in produces a short-lived ID token; this exchanges it for
// a long-lived HttpOnly session cookie the server can verify on every
// request without the client re-authenticating hourly.
export async function POST(request: Request) {
  const { idToken } = await request.json();
  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    await verifyIdToken(idToken); // reject before minting a cookie for a bad/expired token
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
