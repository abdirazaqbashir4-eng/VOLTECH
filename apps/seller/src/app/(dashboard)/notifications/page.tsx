import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireSeller } from "@/lib/session";

export const metadata: Metadata = { title: "Notifications" };

export default async function SellerNotificationsPage() {
  const { session } = await requireSeller();

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (notifications.length > 0) {
    await db.notification.updateMany({ where: { userId: session.user.id, readAt: null }, data: { readAt: new Date() } });
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Notifications</h1>
      {notifications.length === 0 ? (
        <p className="text-sm text-slate-500">No notifications yet.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="rounded-lg border border-[var(--border)] bg-white p-3 text-sm shadow-xs">
              <p className="font-medium text-slate-900">{n.title}</p>
              <p className="text-slate-600">{n.body}</p>
              <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
