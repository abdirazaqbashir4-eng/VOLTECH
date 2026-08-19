import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { requireAdmin } from "@/lib/session";
import ProductDecisionForm from "@/components/ProductDecisionForm";

export const metadata: Metadata = { title: "Product review" };

export default async function AdminProductDetailPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  await requireAdmin();

  const product = await db.product.findUnique({
    where: { id },
    include: { images: true, variants: true, seller: true, category: true },
  });
  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{product.status}</span>
      </div>
      <p className="mb-1 text-sm text-slate-500">Seller: {product.seller.storeName} · Category: {product.category.name}</p>
      <p className="mb-4 text-sm text-slate-600">{product.description}</p>

      <div className="mb-4 flex gap-2">
        {product.images.map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={img.id} src={img.url} alt="" className="h-20 w-20 rounded object-cover" />
        ))}
      </div>

      <table className="mb-4 w-full text-sm">
        <thead className="text-left text-xs uppercase text-slate-500">
          <tr><th className="py-1">SKU</th><th className="py-1">Price</th></tr>
        </thead>
        <tbody>
          {product.variants.map((v) => (
            <tr key={v.id} className="border-t border-[var(--border)]">
              <td className="py-1.5">{v.sku}</td>
              <td className="py-1.5">{formatKES(v.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ProductDecisionForm productId={product.id} status={product.status} />
    </div>
  );
}
