import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { getSellerBalances } from "@voltech/core/marketplace/ledger";
import { requireSeller } from "@/lib/session";
import PayoutRequestForm from "@/components/PayoutRequestForm";

export const metadata: Metadata = { title: "Payouts" };

export default async function PayoutsPage() {
  const { seller } = await requireSeller();
  const [balances, payouts] = await Promise.all([
    getSellerBalances(seller.id),
    db.payout.findMany({ where: { sellerId: seller.id }, orderBy: { requestedAt: "desc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Payouts</h1>
      <PayoutRequestForm availableBalance={balances.availableBalance} />

      <h2 className="mb-2 mt-8 font-semibold text-slate-900">Payout history</h2>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Reference</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Method</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Requested</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-2">{p.payoutReference}</td>
                <td className="px-4 py-2">{formatKES(p.amount)}</td>
                <td className="px-4 py-2">{p.method}</td>
                <td className="px-4 py-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{p.status}</span>
                </td>
                <td className="px-4 py-2 text-slate-500">{new Date(p.requestedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payouts.length === 0 && <p className="mt-4 text-sm text-slate-500">No payouts requested yet.</p>}
    </div>
  );
}
