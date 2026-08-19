import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = { title: "Order history" };

export default async function OrderHistoryPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await db.order.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      sellerOrders: { include: { seller: { select: { storeName: true } } } },
      orderItems: { include: { product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } } } },
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-900">Order history</h1>
      {orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders yet" description="Your placed orders will show up here." actionHref="/" actionLabel="Start shopping" />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const sellerNames = Array.from(new Set(o.sellerOrders.map((so) => so.seller.storeName)));
            return (
              <div key={o.id} className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{o.orderNumber}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString()} · {sellerNames.join(", ")}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                <div className="mt-3 flex gap-2">
                  {o.orderItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-slate-100">
                      {item.product.images[0] && (
                        <Image src={item.product.images[0].url} alt={item.productName} fill sizes="56px" className="object-cover" />
                      )}
                    </div>
                  ))}
                  {o.orderItems.length > 5 && (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-[var(--surface)] text-xs text-slate-500">
                      +{o.orderItems.length - 5}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{formatKES(o.grandTotal)}</p>
                  <Link href={`/account/orders/${o.id}`} className="text-sm font-medium text-brand-teal hover:underline">
                    View order
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
