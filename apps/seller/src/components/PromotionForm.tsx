"use client";

import { useActionState } from "react";
import { createPromotionAction } from "@/app/actions/promotions";

export default function PromotionForm({ products }: { products: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(createPromotionAction, { error: null as string | null });

  return (
    <form action={formAction} className="max-w-lg space-y-3 rounded-lg border border-[var(--border)] bg-white p-5">
      <h2 className="font-semibold text-slate-900">Create a promotion</h2>
      <input name="name" placeholder="Promotion name" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      <div className="grid grid-cols-2 gap-3">
        <select name="discountType" className="rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm">
          <option value="PERCENTAGE">Percentage off</option>
          <option value="FIXED">Fixed amount off</option>
        </select>
        <input name="discountValue" type="number" step="0.01" placeholder="Discount value" required className="rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input name="startsAt" type="datetime-local" required className="rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
        <input name="endsAt" type="datetime-local" required className="rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Products</label>
        <select name="productIds" multiple required className="h-32 w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm">
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={isPending} className="rounded-lg bg-brand-teal shadow-sm transition-colors px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Creating..." : "Create promotion"}
      </button>
    </form>
  );
}
