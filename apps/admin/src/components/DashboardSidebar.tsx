"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DashboardSidebar({
  name,
  links,
  onSignOut,
}: {
  name: string;
  links: { href: string; label: string }[];
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  const nav = (
    <>
      <div className="border-b border-[var(--border)] px-4 py-4">
        <Link href="/dashboard" className="font-bold text-slate-900">VOLTECH Admin</Link>
        <p className="truncate text-xs text-slate-500">{name}</p>
      </div>
      <nav className="space-y-0.5 p-2 text-sm">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={`block rounded-md px-3 py-2 ${isActive(l.href) ? "bg-brand-teal/10 font-medium text-brand-teal-dark" : "text-slate-700 hover:bg-[var(--surface)]"}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <form action={onSignOut} className="border-t border-[var(--border)] p-2">
        <button type="submit" className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-500 hover:bg-[var(--surface)]">
          Sign out
        </button>
      </form>
    </>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-white px-4 py-3 md:hidden">
        <span className="font-bold text-slate-900">VOLTECH Admin</span>
        <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="text-xl">☰</button>
      </div>

      <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-[var(--border)] bg-white md:block">{nav}</aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[85vw] overflow-y-auto bg-white shadow-xl">{nav}</div>
        </div>
      )}
    </>
  );
}
