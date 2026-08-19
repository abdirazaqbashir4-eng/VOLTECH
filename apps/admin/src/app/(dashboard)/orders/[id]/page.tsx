import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Order details" };

export default async function AdminOrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  await requireAdmin();

  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: true,
      address: true,
      payment: true,
      sellerOrders: { include: { items: true, seller: true } },
    },
  });
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">{order.orderNumber}</h1>
      <p className="mb-6 text-sm text-slate-500">
        {order.customer.fullName} ({order.customer.email}) — {new Date(order.createdAt).toLocaleString()}
      </p>

      <div className="space-y-4">
        {order.sellerOrders.map((so) => (
          <div key={so.id} className="rounded-lg border border-[var(--border)] bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-900">{so.seller.storeName}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{so.status}</span>
            </div>
            <ul className="mt-2 space-y-1">
              {so.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatKES(item.lineSubtotal)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">Commission: {formatKES(so.commissionAmount)} ({so.commissionPct}%) — Net: {formatKES(so.netEarning)}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-[var(--border)] bg-white p-4 text-sm">
        <p>Payment: {order.payment?.provider} — {order.payment?.status}</p>
        <p>Total: {formatKES(order.grandTotal)}</p>
        <p className="mt-2 text-slate-600">Delivery: {order.address.recipientName}, {order.address.street}, {order.address.city}, {order.address.county}</p>
      </div>
    </div>
  );
}
