import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";
import CommissionForm from "@/components/CommissionForm";

export const metadata: Metadata = { title: "Commissions" };

export default async function CommissionsPage() {
  await requireAdmin();
  const [rules, categories, sellers] = await Promise.all([
    db.commissionRule.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, include: { category: true, seller: true } }),
    db.category.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.sellerProfile.findMany({ orderBy: { storeName: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Commission settings</h1>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        Resolution order for every sale: seller-specific rule first, then category, then the global default. Rates are stored here — nothing is hard-coded.
      </p>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Scope</th>
                  <th className="px-4 py-2">Target</th>
                  <th className="px-4 py-2">Rate</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2">{r.scope}</td>
                    <td className="px-4 py-2">{r.category?.name ?? r.seller?.storeName ?? "Platform-wide"}</td>
                    <td className="px-4 py-2 font-medium">{r.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <CommissionForm categories={categories} sellers={sellers} />
      </div>
    </div>
  );
}
