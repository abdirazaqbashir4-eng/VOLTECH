"use client";

import Link from "next/link";
import { useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function MobileMenu({
  categories,
  isAuthenticated,
  userName,
  sellerCenterUrl,
}: {
  categories: Category[];
  isAuthenticated: boolean;
  userName: string | null;
  sellerCenterUrl: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center text-xl md:hidden"
      >
        ☰
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-white text-slate-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
              <span className="text-lg font-bold text-brand-ink">VOLTECH</span>
              <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="text-xl text-slate-500">
                ✕
              </button>
            </div>

            <div className="border-b border-[var(--border)] px-4 py-4">
              {isAuthenticated ? (
                <Link href="/account" onClick={() => setOpen(false)} className="font-medium text-brand-teal">
                  Hi, {userName ?? "there"} — My account
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg bg-brand-teal shadow-sm transition-colors px-4 py-2 text-center font-medium text-white"
                >
                  Sign in
                </Link>
              )}
            </div>

            <nav className="flex-1 divide-y divide-[var(--border)] text-sm">
              <Link href="/categories" onClick={() => setOpen(false)} className="block px-4 py-3 font-medium text-slate-900">
                All Categories
              </Link>
              {categories.map((c) => (
                <Link key={c.id} href={`/categories/${c.slug}`} onClick={() => setOpen(false)} className="block px-4 py-3 text-slate-700">
                  {c.name}
                </Link>
              ))}
            </nav>

            <div className="divide-y divide-[var(--border)] border-t border-[var(--border)] text-sm">
              <Link href="/wishlist" onClick={() => setOpen(false)} className="block px-4 py-3 text-slate-700">
                Wishlist
              </Link>
              <a href={`${sellerCenterUrl}/apply`} className="block px-4 py-3 text-slate-700">
                Sell on VOLTECH
              </a>
              <Link href="/help" onClick={() => setOpen(false)} className="block px-4 py-3 text-slate-700">
                Help center
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
