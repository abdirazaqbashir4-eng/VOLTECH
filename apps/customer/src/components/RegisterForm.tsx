"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithCustomToken } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";
import { establishSession, friendlyAuthError } from "@/lib/authClient";
import { registerAction } from "@/app/actions/auth";

export default function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
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
        router.push(callbackUrl);
        router.refresh();
      } catch (err) {
        setError(friendlyAuthError(err));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
        <input name="fullName" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Phone (optional)</label>
        <input name="phone" type="tel" className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
        <input name="password" type="password" required minLength={8} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isPending} className="w-full rounded-md bg-brand-teal py-2.5 font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-brand-teal hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
