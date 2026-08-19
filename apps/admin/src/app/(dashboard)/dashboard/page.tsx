import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [
    gmvAgg,
    commissionAgg,
    orderCount,
    customerCount,
    sellerCount,
    productCount,
    pendingApplications,
    pendingProducts,
    pendingPayouts,
    refundTotal,
    topSellers,
    topCategories,
  ] = await Promise.all([
    db.order.aggregate({ where: { status: { in: ["PAID", "PROCESSING"] } }, _sum: { grandTotal: true } }),
    db.sellerOrder.aggregate({ where: { status: { not: "PENDING_PAYMENT" } }, _sum: { commissionAmount: true } }),
    db.order.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.sellerProfile.count({ where: { status: "APPROVED" } }),
    db.product.count(),
    db.sellerApplication.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    db.product.count({ where: { status: "PENDING_APPROVAL" } }),
    db.payout.count({ where: { status: "PENDING" } }),
    db.ledgerEntry.aggregate({ where: { type: "REFUND" }, _sum: { amount: true } }),
    db.sellerProfile.findMany({ orderBy: { ratingAvg: "desc" }, take: 5, select: { storeName: true, ratingAvg: true, ratingCount: true } }),
    db.category.findMany({
      where: { parentId: null },
      select: { name: true, _count: { select: { products: true } } },
      orderBy: { products: { _count: "desc" } },
      take: 5,
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Marketplace overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="GMV (paid orders)" value={formatKES(gmvAgg._sum.grandTotal ?? 0)} />
        <Stat label="Platform commissions" value={formatKES(commissionAgg._sum.commissionAmount ?? 0)} />
        <Stat label="Total orders" value={String(orderCount)} href="/orders" />
        <Stat label="Refunds" value={formatKES(Math.abs(refundTotal._sum.amount ?? 0))} />
        <Stat label="Customers" value={String(customerCount)} />
        <Stat label="Active sellers" value={String(sellerCount)} href="/sellers" />
        <Stat label="Products" value={String(productCount)} href="/products" />
        <Stat label="Pending payouts" value={String(pendingPayouts)} href="/payouts" accent={pendingPayouts > 0} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link href="/sellers/applications" className={`rounded-lg border p-4 ${pendingApplications > 0 ? "border-brand-amber bg-brand-amber/10" : "border-[var(--border)] bg-white"}`}>
          <p className="text-2xl font-bold text-slate-900">{pendingApplications}</p>
          <p className="text-sm text-slate-500">Pending seller applications</p>
        </Link>
        <Link href="/products" className={`rounded-lg border p-4 ${pendingProducts > 0 ? "border-brand-amber bg-brand-amber/10" : "border-[var(--border)] bg-white"}`}>
          <p className="text-2xl font-bold text-slate-900">{pendingProducts}</p>
          <p className="text-sm text-slate-500">Products awaiting approval</p>
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-white p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Top-rated sellers</h2>
          <ul className="space-y-2 text-sm">
            {topSellers.map((s) => (
              <li key={s.storeName} className="flex justify-between">
                <span>{s.storeName}</span>
                <span className="text-slate-500">{s.ratingAvg.toFixed(1)}★ ({s.ratingCount})</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-white p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Top categories by product count</h2>
          <ul className="space-y-2 text-sm">
            {topCategories.map((c) => (
              <li key={c.name} className="flex items-center justify-between">
                <span>{c.name}</span>
                <span className="text-slate-500">{c._count.products}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, href, accent }: { label: string; value: string; href?: string; accent?: boolean }) {
  const className = `rounded-lg border p-4 ${accent ? "border-brand-amber bg-brand-amber/10" : "border-[var(--border)] bg-white"} ${href ? "hover:border-brand-teal" : ""}`;
  const content = (
    <>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
