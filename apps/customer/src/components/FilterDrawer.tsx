"use client";

import { useState } from "react";

export default function FilterDrawer({
  children,
  trigger,
}: {
  children: React.ReactNode;
  trigger?: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest py-2 font-body-md text-body-md text-on-surface shadow-xs transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span> Filters
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50">
          <button aria-label="Close filters" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-xl bg-surface-container-lowest p-margin-mobile shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Filters</h2>
              <button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="text-xl text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
