import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = { title: "Order history" };

const STATUS_STYLES: Record<string, { icon: string; className: string; label: string }> = {
  PENDING_PAYMENT: { icon: "pending", className: "bg-secondary-container text-on-secondary-container", label: "Processing" },
  PAID: { icon: "pending", className: "bg-secondary-container text-on-secondary-container", label: "Processing" },
  PROCESSING: { icon: "pending", className: "bg-secondary-container text-on-secondary-container", label: "Processing" },
  SHIPPED: { icon: "local_shipping", className: "bg-inverse-primary text-on-primary-fixed", label: "Shipped" },
  DELIVERED: { icon: "check_circle", className: "bg-tertiary-fixed/40 text-on-tertiary-container", label: "Delivered" },
  CANCELLED: { icon: "cancel", className: "bg-error-container text-on-error-container", label: "Cancelled" },
  REFUNDED: { icon: "cancel", className: "bg-error-container text-on-error-container", label: "Refunded" },
};

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
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary mb-1">Orders</h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">Track and manage your recent purchases.</p>

      {orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders yet" description="Your placed orders will show up here." actionHref="/" actionLabel="Start shopping" />
      ) : (
        <div className="flex flex-col gap-stack-md">
          {orders.map((o) => {
            const sellerNames = Array.from(new Set(o.sellerOrders.map((so) => so.seller.storeName)));
            const status = STATUS_STYLES[o.status] ?? STATUS_STYLES.PROCESSING;
            const firstItemImage = o.orderItems[0]?.product.images[0]?.url;
            return (
              <article key={o.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col md:flex-row gap-stack-md md:items-center hover:border-secondary transition-colors">
                <div className="flex-shrink-0 w-full md:w-32 h-32 md:h-24 bg-surface-container-low rounded flex items-center justify-center overflow-hidden relative">
                  {firstItemImage && <Image src={firstItemImage} alt="" fill sizes="128px" className="object-cover" />}
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Order #{o.orderNumber}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded font-label-md text-label-md shrink-0 ${status.className}`}>
                      <span className="material-symbols-outlined text-[14px] mr-1">{status.icon}</span> {status.label}
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-1 line-clamp-1">{sellerNames.join(", ")}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">
                    Placed on {new Date(o.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} • {o.orderItems.length} item(s)
                  </p>
                  <p className="font-headline-sm text-headline-sm text-primary">{formatKES(o.grandTotal)}</p>
                </div>
                <div className="w-full md:w-auto flex flex-row md:flex-col gap-2 pt-3 md:pt-0 border-t border-outline-variant md:border-t-0 md:pl-stack-md md:border-l">
                  <Link href={`/account/orders/${o.id}`} className="flex-1 md:flex-none h-touch-target-min px-4 bg-surface border border-outline-variant text-on-surface font-label-lg text-label-lg rounded hover:bg-surface-container-low transition-colors flex items-center justify-center whitespace-nowrap">
                    View Details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
