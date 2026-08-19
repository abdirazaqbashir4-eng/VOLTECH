import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { auth } from "@/auth";
import { formatKES } from "@voltech/core/money";
import ReturnRequestButton from "@/components/ReturnRequestButton";
import StatusBadge from "@/components/StatusBadge";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      address: true,
      payment: true,
      timeline: { orderBy: { createdAt: "asc" } },
      sellerOrders: { include: { items: true, seller: true, returns: true } },
    },
  });

  if (!order || order.customerId !== session.user.id) notFound();

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold text-slate-900">Order {order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mb-6 text-sm text-slate-500">Placed {new Date(order.createdAt).toLocaleString()}</p>

      <div className="space-y-4">
        {order.sellerOrders.map((so) => (
          <div key={so.id} className="rounded-lg border border-[var(--border)] p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-900">{so.seller.storeName}</p>
              <StatusBadge status={so.status} />
            </div>
            {so.trackingNumber && <p className="text-xs text-slate-500">Tracking: {so.trackingNumber}</p>}
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {so.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatKES(item.lineSubtotal)}</span>
                </li>
              ))}
            </ul>
            {so.status === "DELIVERED" && so.returns.length === 0 && <div className="mt-2"><ReturnRequestButton sellerOrderId={so.id} /></div>}
            {so.returns.map((r) => (
              <p key={r.id} className="mt-2 text-xs text-slate-500">Return {r.status.toLowerCase()} — {r.reason}</p>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-[var(--border)] p-4 text-sm">
        <div className="flex justify-between"><span>Product subtotal</span><span>{formatKES(order.itemsSubtotal)}</span></div>
        {order.discountTotal > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatKES(order.discountTotal)}</span></div>}
        <div className="flex justify-between"><span>Delivery</span><span>{formatKES(order.shippingTotal)}</span></div>
        <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 font-semibold text-slate-900"><span>Total</span><span>{formatKES(order.grandTotal)}</span></div>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 font-medium text-slate-900">Delivery address</h2>
        <p className="text-sm text-slate-600">{order.address.recipientName}, {order.address.street}, {order.address.city}, {order.address.county}</p>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 font-medium text-slate-900">Order timeline</h2>
        <ul className="space-y-1 text-sm text-slate-600">
          {order.timeline.map((ev) => (
            <li key={ev.id}>
              {new Date(ev.createdAt).toLocaleString()} — {ev.status}{ev.note ? `: ${ev.note}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
