"use client";

import { useActionState } from "react";
import { updateStoreSettingsAction } from "@/app/actions/settings";

export default function StoreSettingsForm({ storeDescription, logoUrl, bannerUrl }: { storeDescription: string; logoUrl: string | null; bannerUrl: string | null }) {
  const [state, formAction, isPending] = useActionState(updateStoreSettingsAction, { success: false });

  return (
    <form action={formAction} className="max-w-lg space-y-3 rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Store description</label>
        <textarea name="storeDescription" defaultValue={storeDescription} rows={3} className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Logo URL</label>
        <input name="logoUrl" defaultValue={logoUrl ?? ""} className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Banner URL</label>
        <input name="bannerUrl" defaultValue={bannerUrl ?? ""} className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      </div>
      {state.success && <p className="text-sm text-green-700">Saved.</p>}
      <button type="submit" disabled={isPending} className="rounded-lg bg-brand-teal shadow-sm transition-colors px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
