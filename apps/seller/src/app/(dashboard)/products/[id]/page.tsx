import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireSeller } from "@/lib/session";
import VariantRow from "@/components/VariantRow";

export const metadata: Metadata = { title: "Product details" };

export default async function ProductDetailPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const { seller } = await requireSeller();

  const product = await db.product.findUnique({
    where: { id },
    include: { variants: { include: { inventory: true } }, images: { orderBy: { sortOrder: "asc" } }, category: true },
  });

  if (!product || product.sellerId !== seller.id) notFound();

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{product.status}</span>
      </div>

      {product.status === "REJECTED" && product.rejectionReason && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Rejected: {product.rejectionReason}</div>
      )}

      <p className="mb-1 text-sm text-slate-500">Category: {product.category.name}</p>
      <p className="mb-6 max-w-2xl text-sm text-slate-600">{product.description}</p>

      <div className="mb-6 flex gap-2">
        {product.images.map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={img.id} src={img.url} alt="" className="h-20 w-20 rounded object-cover" />
        ))}
      </div>

      <h2 className="mb-2 font-semibold text-slate-900">Variants</h2>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Variant</th>
              <th className="px-4 py-2">Price (KES)</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Restock</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {product.variants.map((v) => (
              <VariantRow
                key={v.id}
                variant={{
                  id: v.id,
                  sku: v.sku,
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
