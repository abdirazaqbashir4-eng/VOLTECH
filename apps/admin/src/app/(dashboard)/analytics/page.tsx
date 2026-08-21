import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { requireAdmin } from "@/lib/session";
import TimeSeriesChart from "@/components/TimeSeriesChart";

export const metadata: Metadata = { title: "Marketplace analytics" };

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
] as const;

// Matches the existing dashboard's GMV definition (paid/processing orders).
const COMPLETED_ORDER_STATUSES = ["PAID", "PROCESSING"];

function dayKey(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps<"/analytics">) {
  await requireAdmin();
  const sp = await searchParams;
  const rangeDays = Number(typeof sp.range === "string" ? sp.range : "30") || 30;
  const since = new Date();
  since.setDate(since.getDate() - rangeDays);

  const [orders, newCustomers, newSellers, topCategories, topSellers, topProducts, refundAgg, returnCount, totalOrdersInRange, totalViewsAgg] =
    await Promise.all([
      db.order.findMany({
        where: { createdAt: { gte: since }, status: { in: COMPLETED_ORDER_STATUSES } },
        select: { createdAt: true, grandTotal: true },
      }),
      db.user.findMany({ where: { role: "CUSTOMER", createdAt: { gte: since } }, select: { createdAt: true } }),
      db.sellerProfile.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      db.category.findMany({
        where: { parentId: null },
        select: { name: true, _count: { select: { products: true } } },
        orderBy: { products: { _count: "desc" } },
        take: 5,
      }),
      db.sellerProfile.findMany({ orderBy: { ratingAvg: "desc" }, take: 5, select: { storeName: true, ratingAvg: true, ratingCount: true } }),
      db.product.findMany({ where: { status: "APPROVED" }, orderBy: { soldCount: "desc" }, take: 5, select: { name: true, soldCount: true } }),
      db.ledgerEntry.aggregate({ where: { type: "REFUND", createdAt: { gte: since } }, _sum: { amount: true } }),
      db.returnRequest.count({ where: { requestedAt: { gte: since } } }),
      db.order.count({ where: { createdAt: { gte: since } } }),
      db.product.aggregate({ _sum: { viewCount: true } }),
    ]);

  const dayBuckets = new Map<string, { gmv: number; orders: number; customers: number; sellers: number }>();
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayBuckets.set(dayKey(d), { gmv: 0, orders: 0, customers: 0, sellers: 0 });
  }
  for (const o of orders) {
    const b = dayBuckets.get(dayKey(o.createdAt));
    if (b) {
      b.gmv += o.grandTotal;
      b.orders += 1;
    }
  }
  for (const c of newCustomers) {
    const b = dayBuckets.get(dayKey(c.createdAt));
    if (b) b.customers += 1;
  }
  for (const s of newSellers) {
    const b = dayBuckets.get(dayKey(s.createdAt));
    if (b) b.sellers += 1;
  }

  const gmvSeries = Array.from(dayBuckets.entries()).map(([date, v]) => ({ date, value: v.gmv }));
  const orderSeries = Array.from(dayBuckets.entries()).map(([date, v]) => ({ date, value: v.orders }));
  const customerSeries = Array.from(dayBuckets.entries()).map(([date, v]) => ({ date, value: v.customers }));
  const sellerSeries = Array.from(dayBuckets.entries()).map(([date, v]) => ({ date, value: v.sellers }));

  const totalGmv = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const orderCount = orders.length;
  const avgOrderValue = orderCount > 0 ? totalGmv / orderCount : 0;
  const refundTotal = Math.abs(refundAgg._sum.amount ?? 0);
  const refundRate = totalGmv > 0 ? (refundTotal / totalGmv) * 100 : 0;
  const returnRate = totalOrdersInRange > 0 ? (returnCount / totalOrdersInRange) * 100 : 0;
  const totalViews = totalViewsAgg._sum.viewCount ?? 0;
  const conversionRate = totalViews > 0 ? (orderCount / totalViews) * 100 : 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Marketplace analytics</h1>
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
        <Stat label="GMV" value={formatKES(totalGmv)} />
        <Stat label="Orders" value={String(orderCount)} />
        <Stat label="Average order value" value={formatKES(avgOrderValue)} />
        <Stat label="Conversion rate" value={`${conversionRate.toFixed(2)}%`} />
        <Stat label="Refund rate" value={`${refundRate.toFixed(1)}%`} />
        <Stat label="Return rate" value={`${returnRate.toFixed(1)}%`} />
        <Stat label="New customers" value={String(newCustomers.length)} />
        <Stat label="New sellers" value={String(newSellers.length)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="mb-3 font-semibold text-slate-900">GMV over time</h2>
          <TimeSeriesChart data={gmvSeries} valueLabel="GMV" currency />
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="mb-3 font-semibold text-slate-900">Orders over time</h2>
          <TimeSeriesChart data={orderSeries} valueLabel="Orders" color="#f59e0b" />
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="mb-3 font-semibold text-slate-900">Customer growth</h2>
          <TimeSeriesChart data={customerSeries} valueLabel="New customers" color="#0b1220" />
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="mb-3 font-semibold text-slate-900">Seller growth</h2>
          <TimeSeriesChart data={sellerSeries} valueLabel="New sellers" color="#0f766e" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="mb-3 font-semibold text-slate-900">Top categories</h2>
          <ul className="space-y-2 text-sm">
            {topCategories.map((c) => (
              <li key={c.name} className="flex items-center justify-between">
                <span>{c.name}</span>
                <span className="text-slate-500">{c._count.products} products</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="mb-3 font-semibold text-slate-900">Top-rated sellers</h2>
          <ul className="space-y-2 text-sm">
            {topSellers.map((s) => (
              <li key={s.storeName} className="flex items-center justify-between">
                <span>{s.storeName}</span>
                <span className="text-slate-500">{s.ratingAvg.toFixed(1)}★ ({s.ratingCount})</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="mb-3 font-semibold text-slate-900">Top products (all-time)</h2>
          <ul className="space-y-2 text-sm">
            {topProducts.map((p) => (
              <li key={p.name} className="flex items-center justify-between">
                <span className="truncate">{p.name}</span>
                <span className="shrink-0 text-slate-500">{p.soldCount} sold</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-xs">
      <p className="font-display text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
