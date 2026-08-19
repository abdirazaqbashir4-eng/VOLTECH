"use client";

import { useActionState } from "react";
import { createAdminAction } from "@/app/actions/admins";

export default function CreateAdminForm() {
  const [state, formAction, isPending] = useActionState(createAdminAction, { error: null as string | null });

  return (
    <form action={formAction} className="max-w-md space-y-3 rounded-lg border border-[var(--border)] bg-white p-4">
      <h2 className="font-semibold text-slate-900">Add administrator</h2>
      <input name="fullName" placeholder="Full name" required className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" />
      <input name="email" type="email" placeholder="Email" required className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" />
      <input name="password" type="password" placeholder="Temporary password" required minLength={8} className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={isPending} className="rounded-md bg-brand-teal px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Creating..." : "Create admin account"}
      </button>
    </form>
  );
}
