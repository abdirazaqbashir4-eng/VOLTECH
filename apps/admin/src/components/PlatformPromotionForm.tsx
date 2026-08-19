"use client";

import { useActionState, useState } from "react";
import { createPlatformPromotionAction } from "@/app/actions/promotions";

export default function PlatformPromotionForm({ categories, products }: { categories: { id: string; name: string }[]; products: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(createPlatformPromotionAction, { error: null as string | null });
  const [scope, setScope] = useState<"PLATFORM" | "CATEGORY" | "FLASH_SALE">("PLATFORM");

  return (
    <form action={formAction} className="max-w-lg space-y-3 rounded-lg border border-[var(--border)] bg-white p-5">
      <h2 className="font-semibold text-slate-900">Create platform promotion</h2>
      <input name="name" placeholder="Promotion name" required className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" />
      <select name="scope" value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm">
        <option value="PLATFORM">Platform-wide (selected products)</option>
        <option value="FLASH_SALE">Flash sale (selected products)</option>
        <option value="CATEGORY">Entire category</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        <select name="discountType" className="rounded-md border border-[var(--border)] px-3 py-2 text-sm">
          <option value="PERCENTAGE">Percentage off</option>
          <option value="FIXED">Fixed amount off</option>
        </select>
        <input name="discountValue" type="number" step="0.01" placeholder="Value" required className="rounded-md border border-[var(--border)] px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input name="startsAt" type="datetime-local" required className="rounded-md border border-[var(--border)] px-3 py-2 text-sm" />
        <input name="endsAt" type="datetime-local" required className="rounded-md border border-[var(--border)] px-3 py-2 text-sm" />
      </div>
      {scope === "CATEGORY" ? (
        <select name="categoryId" required className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm">
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      ) : (
        <select name="productIds" multiple required className="h-32 w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm">
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={isPending} className="rounded-md bg-brand-teal px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Creating..." : "Create promotion"}
      </button>
    </form>
  );
}
