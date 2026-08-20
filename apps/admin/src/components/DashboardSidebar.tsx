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
      <div className="border-b border-white/[0.08] px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 font-display text-lg font-bold tracking-tight text-white">
          VOLTECH <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-teal">ADMIN</span>
        </Link>
        <p className="truncate text-xs text-white/50">{name}</p>
      </div>
      <nav className="space-y-0.5 p-2 text-sm">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={`block rounded-lg px-3 py-2 transition-colors ${
              isActive(l.href) ? "bg-white/10 font-medium text-white shadow-[inset_2px_0_0_var(--brand-teal)]" : "text-white/65 hover:bg-white/5 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <form action={onSignOut} className="border-t border-white/[0.08] p-2">
        <button type="submit" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white">
          Sign out
        </button>
      </form>
    </>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--brand-ink)] px-4 py-3 text-white shadow-sm md:hidden">
        <span className="font-display font-bold">VOLTECH Admin</span>
        <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="text-xl">☰</button>
      </div>

      <aside className="hidden w-60 shrink-0 overflow-y-auto bg-[var(--brand-ink)] md:block">{nav}</aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[85vw] overflow-y-auto bg-[var(--brand-ink)] shadow-xl">{nav}</div>
        </div>
      )}
    </>
  );
}
