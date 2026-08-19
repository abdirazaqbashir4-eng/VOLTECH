import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { requireSeller } from "@/lib/session";

export const metadata: Metadata = { title: "Products" };

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
  DRAFT: "bg-slate-100 text-slate-600",
  SUSPENDED: "bg-red-100 text-red-700",
};

export default async function ProductsPage() {
  const { seller } = await requireSeller();

  const products = await db.product.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Products</h1>
        <Link href="/products/new" className="rounded-md bg-brand-teal px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-dark">
          + Add product
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Variants</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = p.variants.length; // rows only — actual qty shown via inventory page
              return (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                  <td className="px-4 py-3">
                    <Link href={`/products/${p.id}`} className="font-medium text-slate-900 hover:text-brand-teal">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? "bg-slate-100"}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">{stock}</td>
                  <td className="px-4 py-3">{p.soldCount} sold</td>
                  <td className="px-4 py-3">{formatKES(p.basePrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {products.length === 0 && <p className="mt-4 text-sm text-slate-500">No products yet.</p>}
    </div>
  );
}
