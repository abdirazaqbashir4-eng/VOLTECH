import type { Metadata } from "next";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import { requireAdmin } from "@/lib/session";
import PayoutDecisionButtons from "@/components/PayoutDecisionButtons";

export const metadata: Metadata = { title: "Payouts" };

export default async function AdminPayoutsPage() {
  await requireAdmin();
  const payouts = await db.payout.findMany({ orderBy: { requestedAt: "desc" }, include: { seller: true } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Seller payouts</h1>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Reference</th>
              <th className="px-4 py-2">Seller</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Method</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-2">{p.payoutReference}</td>
                <td className="px-4 py-2">{p.seller.storeName}</td>
                <td className="px-4 py-2">{formatKES(p.amount)}</td>
                <td className="px-4 py-2">{p.method}</td>
                <td className="px-4 py-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{p.status}</span>
                </td>
                <td className="px-4 py-2">{p.status === "PENDING" && <PayoutDecisionButtons payoutId={p.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payouts.length === 0 && <p className="mt-4 text-sm text-slate-500">No payout requests yet.</p>}
    </div>
  );
}
