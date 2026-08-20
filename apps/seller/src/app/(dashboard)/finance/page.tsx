import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { getSellerBalances } from "@voltech/core/marketplace/ledger";
import { requireSeller } from "@/lib/session";

export const metadata: Metadata = { title: "Finance" };

export default async function FinancePage() {
  const { seller } = await requireSeller();
  const [balances, entries] = await Promise.all([
    getSellerBalances(seller.id),
    db.ledgerEntry.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Finance</h1>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card label="Gross sales" value={formatKES(balances.grossSales)} />
        <Card label="Commission" value={formatKES(balances.commission)} />
        <Card label="Refunds" value={formatKES(balances.refunds)} />
        <Card label="Net earnings" value={formatKES(balances.netEarnings)} />
        <Card label="Pending balance" value={formatKES(balances.pendingBalance)} />
        <Card label="Available balance" value={formatKES(balances.availableBalance)} accent />
      </div>

      <h2 className="mb-2 mt-8 font-semibold text-slate-900">Ledger</h2>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Bucket</th>
              <th className="px-4 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-2 text-slate-500">{new Date(e.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2">{e.type}</td>
                <td className="px-4 py-2 text-slate-600">{e.description}</td>
                <td className="px-4 py-2 text-slate-500">{e.balanceType}</td>
                <td className={`px-4 py-2 font-medium ${e.amount >= 0 ? "text-green-700" : "text-red-600"}`}>{formatKES(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.length === 0 && <p className="mt-4 text-sm text-slate-500">No transactions yet.</p>}
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${accent ? "border-brand-teal bg-brand-teal/5" : "border-[var(--border)] bg-white"}`}>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
