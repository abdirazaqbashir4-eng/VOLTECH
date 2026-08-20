import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Sellers" };

export default async function SellersPage() {
  await requireAdmin();
  const sellers = await db.sellerProfile.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { products: true } } } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Sellers</h1>
        <Link href="/sellers/applications" className="text-sm text-brand-teal hover:underline">
          View applications →
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Store</th>
              <th className="px-4 py-2">Products</th>
              <th className="px-4 py-2">Rating</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id} className="border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--surface)]">
                <td className="px-4 py-3">
                  <Link href={`/sellers/${s.id}`} className="font-medium text-slate-900 hover:text-brand-teal">
                    {s.storeName}
                  </Link>
                </td>
                <td className="px-4 py-3">{s._count.products}</td>
                <td className="px-4 py-3">{s.ratingCount > 0 ? `${s.ratingAvg.toFixed(1)}★ (${s.ratingCount})` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.status}</span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/sellers/${s.id}`} className="text-xs text-brand-teal hover:underline">Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
