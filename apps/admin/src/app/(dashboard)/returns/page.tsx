import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";
import AdminReturnDecisionButtons from "@/components/AdminReturnDecisionButtons";

export const metadata: Metadata = { title: "Returns" };

export default async function AdminReturnsPage() {
  await requireAdmin();
  const returns = await db.returnRequest.findMany({
    orderBy: { requestedAt: "desc" },
    include: { sellerOrder: { include: { seller: true } } },
    take: 100,
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Returns &amp; disputes</h1>
      <div className="space-y-3">
        {returns.map((r) => (
          <div key={r.id} className="rounded-lg border border-[var(--border)] bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-900">{r.sellerOrder.sellerOrderNumber} — {r.sellerOrder.seller.storeName}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{r.status}</span>
            </div>
            <p className="text-slate-600">Reason: {r.reason}</p>
            {r.status === "REQUESTED" && <div className="mt-2"><AdminReturnDecisionButtons returnId={r.id} /></div>}
          </div>
        ))}
      </div>
      {returns.length === 0 && <p className="text-sm text-slate-500">No return requests.</p>}
    </div>
  );
}
