"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signInWithCustomToken } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";
import { establishSession, friendlyAuthError } from "@/lib/authClient";
import { registerAction } from "@/app/actions/auth";

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerAction(null, formData);
      if (result.error || !result.customToken) {
        setError(result.error ?? "Could not create your account.");
        return;
      }
      try {
        const credential = await signInWithCustomToken(firebaseAuth, result.customToken);
        await establishSession(credential.user);
        // Full navigation, not router.push: /apply may have been prefetched
        // while signed out and the client Router Cache would replay that
        // stale redirect-to-login instead of re-running proxy with the new
        // session cookie.
        window.location.assign("/apply");
      } catch (err) {
        setError(friendlyAuthError(err));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
        <input name="fullName" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
        <input name="phone" type="tel" className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
        <input name="password" type="password" required minLength={8} className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
      </div>
      {error && <p className="rounded-lg bg-[var(--danger-light)] px-3 py-2 text-sm text-[var(--danger-dark)]">{error}</p>}
      <button type="submit" disabled={isPending} className="w-full rounded-lg bg-brand-teal py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-brand-teal-dark disabled:cursor-not-allowed disabled:opacity-50">
        {isPending ? "Creating account..." : "Continue to seller application"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-teal hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
