import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { requireSeller } from "@/lib/session";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const { seller } = await requireSeller();
  const orders = await db.sellerOrder.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    include: { items: true, order: { select: { orderNumber: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Orders</h1>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Items</th>
              <th className="px-4 py-2">Net earning</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((so) => (
              <tr key={so.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                <td className="px-4 py-3">
                  <Link href={`/orders/${so.id}`} className="font-medium text-slate-900 hover:text-brand-teal">
                    {so.sellerOrderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{so.items.length}</td>
                <td className="px-4 py-3">{formatKES(so.netEarning)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{so.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(so.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && <p className="mt-4 text-sm text-slate-500">No orders yet.</p>}
    </div>
  );
}
