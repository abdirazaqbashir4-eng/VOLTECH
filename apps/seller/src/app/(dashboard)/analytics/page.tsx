import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { requireSeller } from "@/lib/session";
import SalesLineChart from "@/components/SalesLineChart";
import TopProductsChart from "@/components/TopProductsChart";

export const metadata: Metadata = { title: "Analytics" };

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
] as const;

const COMPLETED_STATUSES = ["PAID", "PROCESSING", "READY_FOR_FULFILLMENT", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

export default async function SellerAnalyticsPage({ searchParams }: PageProps<"/analytics">) {
  const { seller } = await requireSeller();
  const sp = await searchParams;
  const rangeDays = Number(typeof sp.range === "string" ? sp.range : "30") || 30;

  const since = new Date();
  since.setDate(since.getDate() - rangeDays);

  const [orders, productViews, orderItems] = await Promise.all([
    db.sellerOrder.findMany({
      where: { sellerId: seller.id, createdAt: { gte: since }, status: { in: COMPLETED_STATUSES } },
      select: { createdAt: true, itemsSubtotal: true, netEarning: true },
      orderBy: { createdAt: "asc" },
    }),
    db.product.aggregate({ where: { sellerId: seller.id }, _sum: { viewCount: true } }),
    db.orderItem.findMany({
      where: { sellerOrder: { sellerId: seller.id, createdAt: { gte: since }, status: { in: COMPLETED_STATUSES } } },
      select: { productName: true, quantity: true },
    }),
  ]);

  // Aggregate revenue/orders by day (JS-side — small, per-seller dataset, avoids raw SQL).
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay.set(d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = o.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const entry = byDay.get(key);
    if (entry) {
      entry.revenue += o.itemsSubtotal;
      entry.orders += 1;
    }
  }
  const chartData = Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }));

  const totalRevenue = orders.reduce((sum, o) => sum + o.itemsSubtotal, 0);
  const totalNetEarning = orders.reduce((sum, o) => sum + o.netEarning, 0);
  const orderCount = orders.length;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
  const totalViews = productViews._sum.viewCount ?? 0;
  const conversionRate = totalViews > 0 ? (orderCount / totalViews) * 100 : 0;

  const unitsByProduct = new Map<string, number>();
  for (const item of orderItems) {
    unitsByProduct.set(item.productName, (unitsByProduct.get(item.productName) ?? 0) + item.quantity);
  }
  const topProducts = Array.from(unitsByProduct.entries())
    .map(([name, unitsSold]) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, unitsSold }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 8);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/analytics?range=${r.key}`}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                String(rangeDays) === r.key ? "border-brand-teal bg-brand-teal/10 text-brand-teal-dark" : "border-[var(--border)] text-slate-600"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={formatKES(totalRevenue)} />
        <Stat label="Orders" value={String(orderCount)} />
        <Stat label="Average order value" value={formatKES(avgOrderValue)} />
        <Stat label="Net earnings" value={formatKES(totalNetEarning)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Stat label="Product views (all-time)" value={totalViews.toLocaleString()} />
        <Stat label="Conversion rate" value={`${conversionRate.toFixed(1)}%`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="mb-3 font-semibold text-slate-900">Revenue over time</h2>
          <SalesLineChart data={chartData} />
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="mb-3 font-semibold text-slate-900">Top products by units sold</h2>
          {topProducts.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">No sales in this period yet.</p>
          ) : (
            <TopProductsChart data={topProducts} />
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <p className="font-display text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
