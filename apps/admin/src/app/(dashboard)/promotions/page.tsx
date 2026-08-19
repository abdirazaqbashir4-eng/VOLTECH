import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";
import PlatformPromotionForm from "@/components/PlatformPromotionForm";

export const metadata: Metadata = { title: "Promotions" };

export default async function AdminPromotionsPage() {
  await requireAdmin();
  const [categories, products, promotions] = await Promise.all([
    db.category.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.product.findMany({ where: { status: "APPROVED" }, select: { id: true, name: true }, take: 200 }),
    db.promotion.findMany({
      where: { scope: { in: ["PLATFORM", "CATEGORY", "FLASH_SALE"] } },
      orderBy: { createdAt: "desc" },
      include: { category: true, products: { include: { product: true } } },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Promotions</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <PlatformPromotionForm categories={categories} products={products} />
        <div>
          <h2 className="mb-2 font-semibold text-slate-900">Active &amp; scheduled</h2>
          <div className="space-y-3">
            {promotions.map((p) => (
              <div key={p.id} className="rounded-lg border border-[var(--border)] bg-white p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{p.name}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{p.status}</span>
                </div>
                <p className="text-slate-600">
                  {p.scope} — {p.discountType === "PERCENTAGE" ? `${p.discountValue}% off` : `KES ${p.discountValue} off`}
                  {p.category && ` — ${p.category.name}`}
                </p>
                {p.products.length > 0 && <p className="text-xs text-slate-500">{p.products.map((pp) => pp.product.name).join(", ")}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
