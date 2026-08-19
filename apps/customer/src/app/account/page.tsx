import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import StatusBadge from "@/components/StatusBadge";
import ProductCard from "@/components/ProductCard";
import { toCardData } from "@/lib/catalog";

export const metadata: Metadata = { title: "My account" };

export default async function AccountOverviewPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [orderCount, wishlistCount, recentOrders, recentlyViewed] = await Promise.all([
    db.order.count({ where: { customerId: session.user.id } }),
    db.wishlistItem.count({ where: { userId: session.user.id } }),
    db.order.findMany({ where: { customerId: session.user.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.recentlyViewed.findMany({
      where: { userId: session.user.id },
      orderBy: { viewedAt: "desc" },
      take: 5,
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { sortOrder: "asc" } },
            variants: { where: { status: "ACTIVE" } },
            seller: { select: { storeName: true, status: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-900">My account</h1>
      <div className="rounded-lg border border-[var(--border)] p-5">
        <p className="font-medium text-slate-900">{session.user.name}</p>
        <p className="text-sm text-slate-500">{session.user.email}</p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link href="/account/orders" className="rounded-lg border border-[var(--border)] p-5 hover:border-brand-teal">
          <p className="text-2xl font-bold text-slate-900">{orderCount}</p>
          <p className="text-sm text-slate-500">Orders placed</p>
        </Link>
        <Link href="/wishlist" className="rounded-lg border border-[var(--border)] p-5 hover:border-brand-teal">
          <p className="text-2xl font-bold text-slate-900">{wishlistCount}</p>
          <p className="text-sm text-slate-500">Wishlist items</p>
        </Link>
      </div>

      {recentOrders.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent orders</h2>
            <Link href="/account/orders" className="text-sm text-brand-teal hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/account/orders/${o.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-sm hover:border-brand-teal"
              >
                <span className="font-medium text-slate-900">{o.orderNumber}</span>
                <span className="text-slate-500">{formatKES(o.grandTotal)}</span>
                <StatusBadge status={o.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {recentlyViewed.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-semibold text-slate-900">Recently viewed</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {recentlyViewed.filter((v) => v.product.variants.length > 0).map((v) => (
              <ProductCard key={v.id} product={toCardData(v.product)} isAuthenticated />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
