import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { getSellerBalances } from "@voltech/core/marketplace/ledger";
import { requireAdmin } from "@/lib/session";
import SellerStatusButton from "@/components/SellerStatusButton";

export const metadata: Metadata = { title: "Seller details" };

export default async function AdminSellerDetailPage({ params }: PageProps<"/sellers/[id]">) {
  const { id } = await params;
  await requireAdmin();

  const seller = await db.sellerProfile.findUnique({ where: { id }, include: { user: true, _count: { select: { products: true } } } });
  if (!seller) notFound();

  const [balances, orderCount] = await Promise.all([
    getSellerBalances(seller.id),
    db.sellerOrder.count({ where: { sellerId: seller.id } }),
  ]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{seller.storeName}</h1>
          <p className="text-sm text-slate-500">{seller.user.email}</p>
        </div>
        <SellerStatusButton sellerId={seller.id} status={seller.status as "APPROVED" | "SUSPENDED"} />
      </div>

      <p className="mb-6 max-w-2xl text-sm text-slate-600">{seller.storeDescription}</p>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Products" value={String(seller._count.products)} />
        <Stat label="Orders" value={String(orderCount)} />
        <Stat label="Gross sales" value={formatKES(balances.grossSales)} />
        <Stat label="Available balance" value={formatKES(balances.availableBalance)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-xs">
      <p className="font-display text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
