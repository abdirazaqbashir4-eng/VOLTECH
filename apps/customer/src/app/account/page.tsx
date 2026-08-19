import type { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@voltech/database";

export const metadata: Metadata = { title: "My account" };

export default async function AccountOverviewPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [orderCount, wishlistCount] = await Promise.all([
    db.order.count({ where: { customerId: session.user.id } }),
    db.wishlistItem.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-900">My account</h1>
      <div className="rounded-lg border border-[var(--border)] p-5">
        <p className="font-medium text-slate-900">{session.user.name}</p>
        <p className="text-sm text-slate-500">{session.user.email}</p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] p-5">
          <p className="text-2xl font-bold text-slate-900">{orderCount}</p>
          <p className="text-sm text-slate-500">Orders placed</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-5">
          <p className="text-2xl font-bold text-slate-900">{wishlistCount}</p>
          <p className="text-sm text-slate-500">Wishlist items</p>
        </div>
      </div>
    </div>
  );
}
