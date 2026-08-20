"use client";

import Link from "next/link";
import { useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
}

export default function MegaMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-white transition-colors hover:bg-white/10"
      >
        <span aria-hidden className="text-base leading-none">☰</span>
        All Categories
      </button>

      {open && categories.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-2 flex w-[640px] overflow-hidden rounded-xl border border-[var(--border)] bg-white text-slate-800 shadow-xl">
          <div className="w-56 shrink-0 border-r border-[var(--border)] bg-[var(--surface)]/60 py-2">
            {categories.map((c, i) => (
              <button
                key={c.id}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                  active === i ? "bg-white font-medium text-brand-teal shadow-[inset_2px_0_0_var(--brand-teal)]" : "text-slate-700"
                }`}
              >
                <Link href={`/categories/${c.slug}`} className="flex-1">{c.name}</Link>
                {c.children.length > 0 && <span aria-hidden className="text-slate-300">›</span>}
              </button>
            ))}
          </div>
          <div className="flex-1 p-5">
            <p className="mb-3 font-display font-semibold text-slate-900">{categories[active]?.name}</p>
            {categories[active]?.children.length ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {categories[active].children.map((child) => (
                  <Link key={child.id} href={`/categories/${child.slug}`} className="text-sm text-slate-600 hover:text-brand-teal">
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : (
              <Link href={`/categories/${categories[active]?.slug}`} className="text-sm text-brand-teal hover:underline">
                Browse all {categories[active]?.name}
              </Link>
            )}
            <Link
              href={`/categories/${categories[active]?.slug}`}
              className="mt-4 inline-block text-sm font-medium text-brand-teal hover:underline"
            >
              Shop all {categories[active]?.name} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
