"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationBell({ items, unreadCount }: { items: NotificationItem[]; unreadCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex items-center hover:text-brand-teal"
      >
        <span aria-hidden className="text-lg leading-none">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-amber px-1 text-[10px] font-semibold text-brand-ink">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button aria-label="Close" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] rounded-md border border-[var(--border)] bg-white text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button type="button" disabled={isPending} onClick={markAllRead} className="text-xs text-brand-teal hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
              ) : (
                items.map((n) => (
                  <Link
                    key={n.id}
                    href={n.linkUrl ?? "/account/notifications"}
                    onClick={() => setOpen(false)}
                    className={`block border-b border-[var(--border)] px-4 py-2.5 text-sm last:border-0 hover:bg-[var(--surface)] ${!n.readAt ? "bg-brand-teal/5" : ""}`}
                  >
                    <p className="font-medium text-slate-900">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-slate-500">{n.body}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </Link>
                ))
              )}
            </div>
            <Link
              href="/account/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-[var(--border)] px-4 py-2.5 text-center text-sm text-brand-teal hover:underline"
            >
              View all
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
