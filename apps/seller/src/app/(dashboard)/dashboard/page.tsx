import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { getSellerBalances } from "@voltech/core/marketplace/ledger";
import { requireSeller } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function SellerDashboardPage() {
  const { seller } = await requireSeller();

  const [pendingOrders, totalOrders, productCount, lowStock, returnCount, balances] = await Promise.all([
    db.sellerOrder.count({ where: { sellerId: seller.id, status: { in: ["PAID", "PROCESSING", "READY_FOR_FULFILLMENT"] } } }),
    db.sellerOrder.count({ where: { sellerId: seller.id } }),
    db.product.count({ where: { sellerId: seller.id } }),
    db.inventory.findMany({
      where: { product: { sellerId: seller.id }, onHand: { lte: 5 } },
      include: { product: true, variant: true },
      take: 5,
    }),
    db.returnRequest.count({ where: { sellerOrder: { sellerId: seller.id }, status: "REQUESTED" } }),
    getSellerBalances(seller.id),
  ]);

  const recentOrders = await db.sellerOrder.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { order: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending orders" value={String(pendingOrders)} href="/orders" />
        <Stat label="Total orders" value={String(totalOrders)} href="/orders" />
        <Stat label="Products" value={String(productCount)} href="/products" />
        <Stat label="Return requests" value={String(returnCount)} href="/returns" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Available balance" value={formatKES(balances.availableBalance)} href="/finance/payouts" accent />
        <Stat label="Pending balance" value={formatKES(balances.pendingBalance)} href="/finance" />
        <Stat label="Gross sales (all-time)" value={formatKES(balances.grossSales)} href="/finance" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="mb-3 font-semibold text-slate-900">Recent orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentOrders.map((so) => (
                <li key={so.id}>
                  <Link href={`/orders/${so.id}`} className="flex justify-between hover:text-brand-teal">
                    <span>{so.sellerOrderNumber}</span>
                    <span className="text-slate-500">{so.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="mb-3 font-semibold text-slate-900">Low stock</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-500">No low-stock items.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStock.map((inv) => (
                <li key={inv.id}>
                  <Link href={`/products/${inv.productId}`} className="flex justify-between hover:text-brand-teal">
                    <span>{inv.product.name}</span>
                    <span className="text-red-600">{inv.onHand} left</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, href, accent }: { label: string; value: string; href: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm ${
        accent ? "border-brand-teal bg-brand-teal/5 hover:border-brand-teal-dark" : "border-[var(--border)] bg-white hover:border-brand-teal"
      }`}
    >
      <p className="font-display text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </Link>
  );
}
