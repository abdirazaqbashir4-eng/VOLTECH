"use client";

import { useQuickView } from "@/contexts/QuickViewContext";

export default function QuickViewButton({ slug, className = "" }: { slug: string; className?: string }) {
  const { openQuickView } = useQuickView();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickView(slug);
      }}
      className={`rounded-md bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur hover:bg-white ${className}`}
    >
      Quick View
    </button>
  );
}
