import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireSeller } from "@/lib/session";
import VariantRow from "@/components/VariantRow";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const { seller } = await requireSeller();

  const variants = await db.productVariant.findMany({
    where: { product: { sellerId: seller.id } },
    include: { inventory: true, product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Inventory</h1>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Product / Variant</th>
              <th className="px-4 py-2">Price (KES)</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Restock</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <VariantRow
                key={v.id}
                variant={{
                  id: v.id,
                  sku: `${v.product.name} — ${v.sku}`,
                  options: JSON.parse(v.optionsJson),
                  price: v.price,
                  compareAtPrice: v.compareAtPrice,
                  status: v.status,
                  onHand: v.inventory?.onHand ?? 0,
                  reserved: v.inventory?.reserved ?? 0,
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
