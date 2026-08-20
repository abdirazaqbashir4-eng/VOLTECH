"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";
import { establishSession, friendlyAuthError } from "@/lib/authClient";

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    startTransition(async () => {
      try {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        await establishSession(credential.user);
        // A full navigation, not router.push: the target route may have
        // been prefetched while signed out (e.g. a nav link to /account),
        // and the client Router Cache would replay that stale redirect-to-
        // login instead of re-running proxy with the new session cookie.
        window.location.assign(callbackUrl);
      } catch (err) {
        setError(friendlyAuthError(err));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
        <input name="password" type="password" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isPending} className="w-full rounded-md bg-brand-teal py-2.5 font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-center text-sm text-slate-500">
        New to VOLTECH?{" "}
        <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-brand-teal hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
