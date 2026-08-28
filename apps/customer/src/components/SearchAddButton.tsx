"use client";

import { useQuickView } from "@/contexts/QuickViewContext";

export default function SearchAddButton({ slug, disabled }: { slug: string; disabled?: boolean }) {
  const { openQuickView } = useQuickView();

  if (disabled) {
    return (
      <span className="h-8 px-4 border border-outline-variant text-on-surface-variant font-label-md text-label-md rounded flex items-center gap-1 opacity-50 cursor-not-allowed">
        Out of Stock
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickView(slug);
      }}
      className="h-8 px-4 bg-secondary text-on-primary font-label-md text-label-md rounded flex items-center gap-1 active:scale-95 transition-transform"
    >
      <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span> Add
    </button>
  );
}
