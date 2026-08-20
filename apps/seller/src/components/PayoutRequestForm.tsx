"use client";

import { useActionState } from "react";
import { requestPayoutAction } from "@/app/actions/payouts";

export default function PayoutRequestForm({ availableBalance }: { availableBalance: number }) {
  const [state, formAction, isPending] = useActionState(requestPayoutAction, { error: null as string | null });

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-xs">
      <div>
        <label className="mb-1 block text-xs text-slate-500">Amount (KES) — available: {availableBalance.toLocaleString()}</label>
        <input name="amount" type="number" step="0.01" max={availableBalance} required className="rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      </div>
      <button type="submit" disabled={isPending || availableBalance <= 0} className="rounded-lg bg-brand-teal shadow-sm transition-colors px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Requesting..." : "Request payout"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
