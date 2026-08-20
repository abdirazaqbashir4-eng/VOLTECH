"use client";

import { useState } from "react";

export default function FilterDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white py-2 text-sm font-medium text-slate-700 shadow-xs transition-colors"
      >
        <span aria-hidden>⚙</span> Filters
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button aria-label="Close filters" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Filters</h2>
              <button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="text-xl text-slate-500">
                ✕
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
