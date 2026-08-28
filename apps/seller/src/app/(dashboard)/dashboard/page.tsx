import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { getSellerBalances } from "@voltech/core/marketplace/ledger";
import { requireSeller } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-secondary-container/20 text-on-secondary-fixed-variant",
  PAID: "bg-secondary-container/20 text-on-secondary-fixed-variant",
  PROCESSING: "bg-secondary-container/20 text-on-secondary-fixed-variant",
  READY_FOR_FULFILLMENT: "bg-secondary-container/20 text-on-secondary-fixed-variant",
  SHIPPED: "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant",
  OUT_FOR_DELIVERY: "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant",
  DELIVERED: "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant",
  CANCELLED: "bg-error-container text-on-error-container",
  RETURNED: "bg-error-container text-on-error-container",
  REFUNDED: "bg-error-container text-on-error-container",
};

export default async function SellerDashboardPage() {
  const { seller } = await requireSeller();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [pendingOrders, totalOrders, returnCount, productCount, lowStock, lowStockCount, balances, recentOrders, recentSellerOrders] = await Promise.all([
    db.sellerOrder.count({ where: { sellerId: seller.id, status: { in: ["PAID", "PROCESSING", "READY_FOR_FULFILLMENT"] } } }),
    db.sellerOrder.count({ where: { sellerId: seller.id } }),
    db.returnRequest.count({ where: { sellerOrder: { sellerId: seller.id }, status: "REQUESTED" } }),
    db.product.count({ where: { sellerId: seller.id } }),
    db.inventory.findMany({
      where: { product: { sellerId: seller.id }, onHand: { lte: 5 } },
      include: { product: true, variant: true },
      take: 5,
    }),
    db.inventory.count({ where: { product: { sellerId: seller.id }, onHand: { lte: 5 } } }),
    getSellerBalances(seller.id),
    db.sellerOrder.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.sellerOrder.findMany({
      where: { sellerId: seller.id, createdAt: { gte: sevenDaysAgo }, status: { not: "CANCELLED" } },
      select: { createdAt: true, itemsSubtotal: true },
    }),
  ]);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const dailyRevenue = days.map((d) => {
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return recentSellerOrders
      .filter((so) => so.createdAt >= d && so.createdAt < next)
      .reduce((sum, so) => sum + so.itemsSubtotal, 0);
  });
  const maxRevenue = Math.max(1, ...dailyRevenue);

  return (
    <div className="flex flex-col gap-stack-lg">
      <section className="flex flex-col gap-stack-xs">
        <h1 className="font-headline-md text-headline-md text-on-surface">Dashboard Overview</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Store: {seller.storeName}</p>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-gutter-mobile">
        <StatCard label="Gross Sales (all-time)" icon="payments" value={formatKES(balances.grossSales)} href="/finance" />
        <StatCard
          label="Pending Orders"
          icon="pending_actions"
          value={String(pendingOrders)}
          href="/orders"
          note={pendingOrders > 0 ? `${pendingOrders} awaiting action` : undefined}
          noteTone="warning"
        />
        <StatCard label="Active Listings" icon="inventory_2" value={String(productCount)} href="/products" />
        <StatCard
          label="Low Stock Alerts"
          icon="inventory"
          value={String(lowStockCount)}
          href="/inventory"
          alert={lowStockCount > 0}
          actionLabel={lowStockCount > 0 ? "Restock now" : undefined}
        />
      </section>

      {/* Balances */}
      <section className="grid grid-cols-2 gap-gutter-mobile">
        <StatCard label="Available Balance" icon="account_balance_wallet" value={formatKES(balances.availableBalance)} href="/finance/payouts" />
        <StatCard label="Pending Balance" icon="hourglass_top" value={formatKES(balances.pendingBalance)} href="/finance" />
      </section>

      {/* Order totals */}
      <section className="grid grid-cols-2 gap-gutter-mobile">
        <StatCard label="Total Orders" icon="receipt_long" value={String(totalOrders)} href="/orders" />
        <StatCard label="Return Requests" icon="assignment_return" value={String(returnCount)} href="/returns" alert={returnCount > 0} />
      </section>

      {/* Revenue Trend */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded p-stack-md flex flex-col gap-stack-md">
        <div className="flex justify-between items-center">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Revenue Trend (7 days)</h2>
        </div>
        <div className="h-48 w-full bg-surface-container-low rounded border border-outline-variant/30 relative overflow-hidden">
          <div className="absolute bottom-0 w-full flex items-end justify-around px-4 h-full pt-8 gap-2">
            {dailyRevenue.map((rev, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-full max-w-8 rounded-t ${i === 6 ? "bg-secondary" : "bg-secondary-fixed-dim opacity-50"}`}
                  style={{ height: `${Math.max(4, (rev / maxRevenue) * 100)}%` }}
                />
                <span className="font-label-md text-label-md text-on-surface-variant">{dayLabels[days[i].getDay()]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Orders */}
      <section className="flex flex-col gap-stack-md">
        <div className="flex justify-between items-center">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Recent Orders</h2>
          <Link href="/orders" className="font-label-md text-label-md text-secondary hover:underline">View All</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentOrders.map((so) => (
              <Link
                key={so.id}
                href={`/orders/${so.id}`}
                className="bg-surface-container-lowest border border-outline-variant rounded p-stack-sm flex justify-between items-center hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-stack-md">
                  <div className="w-10 h-10 bg-surface-variant rounded flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">package_2</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md font-semibold text-on-surface">{so.sellerOrderNumber}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{new Date(so.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-body-md text-body-md font-bold text-on-surface">{formatKES(so.itemsSubtotal)}</span>
                  <span className={`px-2 py-0.5 rounded-full font-label-md text-label-md text-[10px] ${STATUS_STYLES[so.status] ?? STATUS_STYLES.PROCESSING}`}>{so.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Low Stock */}
      <section className="flex flex-col gap-stack-md">
        <div className="flex justify-between items-center">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Low Stock</h2>
          <Link href="/inventory" className="font-label-md text-label-md text-secondary hover:underline">View All</Link>
        </div>
        {lowStock.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">No low-stock items.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {lowStock.map((inv) => (
              <Link
                key={inv.id}
                href={`/products/${inv.productId}`}
                className="bg-surface-container-lowest border border-outline-variant rounded p-stack-sm flex justify-between items-center hover:bg-surface-container-high transition-colors"
              >
                <span className="font-body-md text-body-md text-on-surface">{inv.product.name}</span>
                <span className="font-label-md text-label-md text-error-industrial">{inv.onHand} left</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  icon,
  value,
  href,
  note,
  noteTone,
  alert,
  actionLabel,
}: {
  label: string;
  icon: string;
  value: string;
  href: string;
  note?: string;
  noteTone?: "warning";
  alert?: boolean;
  actionLabel?: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded p-stack-md flex flex-col gap-stack-sm relative overflow-hidden transition-colors ${
        alert ? "bg-error-container border border-error-industrial/20 hover:bg-error-container/80" : "bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-high"
      }`}
    >
      <div className="flex justify-between items-start">
        <span className={`font-label-md text-label-md uppercase tracking-wider ${alert ? "text-on-error-container" : "text-on-surface-variant"}`}>{label}</span>
        <span className={`material-symbols-outlined ${alert ? "text-error-industrial" : "text-secondary"}`}>{icon}</span>
      </div>
      <div className={`font-headline-md text-headline-md ${alert ? "text-on-error-container" : "text-on-surface"}`}>{value}</div>
      {note && (
        <div className={`font-body-sm text-body-sm flex items-center gap-1 ${noteTone === "warning" ? "text-error-industrial" : "text-on-surface-variant"}`}>
          <span className="material-symbols-outlined text-[16px]">warning</span>
          <span>{note}</span>
        </div>
      )}
      {actionLabel && (
        <div className="font-body-sm text-body-sm text-on-error-container">
          <span className="underline font-semibold">{actionLabel}</span>
        </div>
      )}
    </Link>
  );
}
