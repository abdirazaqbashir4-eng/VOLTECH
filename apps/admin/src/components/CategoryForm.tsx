"use client";

import { useActionState } from "react";
import { createCategoryAction } from "@/app/actions/categories";

export default function CategoryForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(createCategoryAction, { error: null as string | null });

  return (
    <form action={formAction} className="max-w-md space-y-3 rounded-lg border border-[var(--border)] bg-white p-4">
      <h2 className="font-semibold text-slate-900">Add category</h2>
      <input name="name" placeholder="Category name" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      <textarea name="description" placeholder="Description (optional)" rows={2} className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      <input name="imageUrl" placeholder="Image URL (optional)" className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      <select name="parentId" className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm">
        <option value="">Top-level category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input name="sortOrder" type="number" placeholder="Sort order" defaultValue={0} className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={isPending} className="rounded-lg bg-brand-teal shadow-sm transition-colors px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Adding..." : "Add category"}
      </button>
    </form>
  );
}
