"use client";

import { useActionState, useState } from "react";
import { createCommissionRuleAction } from "@/app/actions/commissions";

export default function CommissionForm({ categories, sellers }: { categories: { id: string; name: string }[]; sellers: { id: string; storeName: string }[] }) {
  const [state, formAction, isPending] = useActionState(createCommissionRuleAction, { error: null as string | null });
  const [scope, setScope] = useState<"GLOBAL" | "CATEGORY" | "SELLER">("GLOBAL");

  return (
    <form action={formAction} className="max-w-md space-y-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-xs">
      <h2 className="font-semibold text-slate-900">Set commission rule</h2>
      <select name="scope" value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm">
        <option value="GLOBAL">Global (platform default)</option>
        <option value="CATEGORY">Category</option>
        <option value="SELLER">Specific seller</option>
      </select>
      {scope === "CATEGORY" && (
        <select name="categoryId" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm">
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
      {scope === "SELLER" && (
        <select name="sellerId" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm">
          <option value="">Select seller</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>{s.storeName}</option>
          ))}
        </select>
      )}
      <input name="percentage" type="number" step="0.1" min={0} max={100} placeholder="Commission %" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={isPending} className="rounded-lg bg-brand-teal shadow-sm transition-colors px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Saving..." : "Save rule"}
      </button>
    </form>
  );
}
