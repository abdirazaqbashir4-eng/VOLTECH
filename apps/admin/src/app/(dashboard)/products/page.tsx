import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Product moderation" };

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
  DRAFT: "bg-slate-100 text-slate-600",
  SUSPENDED: "bg-red-100 text-red-700",
};

export default async function AdminProductsPage({ searchParams }: PageProps<"/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "PENDING_APPROVAL";

  const products = await db.product.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    include: { seller: { select: { storeName: true } }, category: { select: { name: true } } },
    take: 100,
  });

  const statuses = ["PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED", "ALL"];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-900">Product moderation</h1>
      <div className="mb-4 flex gap-2 text-sm">
        {statuses.map((s) => (
          <Link key={s} href={`/products?status=${s}`} className={`rounded-md px-3 py-1.5 ${status === s ? "bg-brand-teal text-white" : "border border-[var(--border)] text-slate-700"}`}>
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Seller</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                <td className="px-4 py-3">
                  <Link href={`/products/${p.id}`} className="font-medium text-slate-900 hover:text-brand-teal">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.seller.storeName}</td>
                <td className="px-4 py-3">{p.category.name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? "bg-slate-100"}`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {products.length === 0 && <p className="mt-4 text-sm text-slate-500">Nothing here.</p>}
    </div>
  );
}
