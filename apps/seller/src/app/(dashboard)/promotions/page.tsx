import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireSeller } from "@/lib/session";
import PromotionForm from "@/components/PromotionForm";

export const metadata: Metadata = { title: "Promotions" };

export default async function PromotionsPage() {
  const { seller } = await requireSeller();
  const [products, promotions] = await Promise.all([
    db.product.findMany({ where: { sellerId: seller.id, status: "APPROVED" }, select: { id: true, name: true } }),
    db.promotion.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" }, include: { products: { include: { product: true } } } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Promotions</h1>
      <PromotionForm products={products} />

      <h2 className="mb-2 mt-8 font-semibold text-slate-900">Your promotions</h2>
      <div className="space-y-3">
        {promotions.map((p) => (
          <div key={p.id} className="rounded-lg border border-[var(--border)] bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-900">{p.name}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{p.status}</span>
            </div>
            <p className="text-slate-600">
              {p.discountType === "PERCENTAGE" ? `${p.discountValue}% off` : `KES ${p.discountValue} off`} — {p.products.map((pp) => pp.product.name).join(", ")}
            </p>
            <p className="text-xs text-slate-500">
              {new Date(p.startsAt).toLocaleDateString()} – {new Date(p.endsAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
      {promotions.length === 0 && <p className="mt-2 text-sm text-slate-500">No promotions yet.</p>}
    </div>
  );
}
