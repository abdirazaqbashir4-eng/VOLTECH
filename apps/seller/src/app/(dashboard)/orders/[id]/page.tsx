import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { requireSeller } from "@/lib/session";
import OrderStatusControl from "@/components/OrderStatusControl";
import type { SellerOrderStatus } from "@voltech/core/enums";

export const metadata: Metadata = { title: "Order details" };

export default async function SellerOrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const { seller } = await requireSeller();

  const so = await db.sellerOrder.findUnique({
    where: { id },
    include: { items: true, order: { include: { address: true, customer: { select: { fullName: true, phone: true } } } } },
  });

  if (!so || so.sellerId !== seller.id) notFound();

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900">{so.sellerOrderNumber}</h1>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{so.status}</span>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
        <ul className="space-y-2 text-sm">
          {so.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>{item.productName} × {item.quantity}</span>
              <span>{formatKES(item.lineSubtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-[var(--border)] pt-3 text-sm text-slate-600">
          <div className="flex justify-between"><span>Items subtotal</span><span>{formatKES(so.itemsSubtotal)}</span></div>
          <div className="flex justify-between"><span>Commission ({so.commissionPct}%)</span><span>-{formatKES(so.commissionAmount)}</span></div>
          <div className="flex justify-between font-semibold text-slate-900"><span>Net earning</span><span>{formatKES(so.netEarning)}</span></div>
        </div>
        {!["CANCELLED", "RETURNED", "REFUNDED"].includes(so.status) && (
          <OrderStatusControl sellerOrderId={so.id} status={so.status as SellerOrderStatus} />
        )}
      </div>

      <div className="mt-4 rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs text-sm">
        <h2 className="mb-2 font-semibold text-slate-900">Customer</h2>
        <p className="text-slate-600">{so.order.customer.fullName} — {so.order.customer.phone}</p>
        <p className="mt-2 text-slate-600">
          Deliver to: {so.order.address.recipientName}, {so.order.address.street}, {so.order.address.city}, {so.order.address.county}
        </p>
      </div>
    </div>
  );
}
