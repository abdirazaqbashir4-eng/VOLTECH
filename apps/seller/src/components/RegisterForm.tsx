"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, { error: null as string | null });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
        <input name="fullName" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
        <input name="phone" type="tel" className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
        <input name="password" type="password" required minLength={8} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={isPending} className="w-full rounded-md bg-brand-teal py-2.5 font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-50">
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
