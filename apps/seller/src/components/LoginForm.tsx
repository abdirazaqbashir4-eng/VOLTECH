"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, { error: null as string | null });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
        <input name="password" type="password" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={isPending} className="w-full rounded-md bg-brand-teal py-2.5 font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-center text-sm text-slate-500">
        New seller?{" "}
        <Link href="/register" className="text-brand-teal hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
