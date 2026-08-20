"use client";

import Link from "next/link";
import { useState } from "react";

export default function AccountMenu({
  userName,
  onSignOut,
}: {
  userName: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="hidden sm:inline hover:text-brand-teal">
        {userName.split(" ")[0] || "Account"}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 w-56 rounded-md border border-[var(--border)] bg-white py-2 text-sm text-slate-800 shadow-xl">
          <div className="border-b border-[var(--border)] px-4 pb-2">
            <p className="font-medium text-slate-900">Hi, {userName.split(" ")[0] || "there"}</p>
          </div>
          <Link href="/account" className="block px-4 py-2 hover:bg-[var(--surface)]">My account</Link>
          <Link href="/account/orders" className="block px-4 py-2 hover:bg-[var(--surface)]">Order history</Link>
          <Link href="/wishlist" className="block px-4 py-2 hover:bg-[var(--surface)]">Wishlist</Link>
          <Link href="/account/addresses" className="block px-4 py-2 hover:bg-[var(--surface)]">Addresses</Link>
          <Link href="/account/notifications" className="block px-4 py-2 hover:bg-[var(--surface)]">Notifications</Link>
          <form action={onSignOut} className="border-t border-[var(--border)] pt-2">
            <button type="submit" className="block w-full px-4 py-2 text-left text-slate-500 hover:bg-[var(--surface)]">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
