import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";

export const metadata: Metadata = { title: "Order history" };

export default async function OrderHistoryPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await db.order.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { sellerOrders: { select: { status: true } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-900">Order history</h1>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-500">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="block rounded-lg border border-[var(--border)] p-4 hover:border-brand-teal">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{o.orderNumber}</p>
                  <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{formatKES(o.grandTotal)}</p>
                  <p className="text-xs text-slate-500">{o.status}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
