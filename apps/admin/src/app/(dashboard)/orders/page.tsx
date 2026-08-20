import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: { select: { fullName: true } }, payment: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Orders</h1>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Payment</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                <td className="px-4 py-3">
                  <Link href={`/orders/${o.id}`} className="font-medium text-slate-900 hover:text-brand-teal">{o.orderNumber}</Link>
                </td>
                <td className="px-4 py-3">{o.customer.fullName}</td>
                <td className="px-4 py-3">{formatKES(o.grandTotal)}</td>
                <td className="px-4 py-3">{o.payment?.status ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{o.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
