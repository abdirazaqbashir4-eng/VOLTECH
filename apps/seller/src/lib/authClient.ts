"use client";

import type { User } from "firebase/auth";
import { FirebaseError } from "firebase/app";

/** POSTs the client's ID token to /api/session so the server can mint an HttpOnly session cookie. Called right after any client-side Firebase sign-in (password, or custom-token after registration). */
export async function establishSession(user: User): Promise<void> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("Could not establish a session.");
}

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Invalid email or password.",
  "auth/user-not-found": "Invalid email or password.",
  "auth/wrong-password": "Invalid email or password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/too-many-requests": "Too many attempts — please wait a moment and try again.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/network-request-failed": "Network error — check your connection and try again.",
};

export function friendlyAuthError(err: unknown): string {
  if (err instanceof FirebaseError) return MESSAGES[err.code] ?? "Something went wrong. Please try again.";
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
