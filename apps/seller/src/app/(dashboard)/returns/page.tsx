import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireSeller } from "@/lib/session";
import ReturnDecisionButtons from "@/components/ReturnDecisionButtons";

export const metadata: Metadata = { title: "Returns" };

export default async function ReturnsPage() {
  const { seller } = await requireSeller();
  const returns = await db.returnRequest.findMany({
    where: { sellerOrder: { sellerId: seller.id } },
    orderBy: { requestedAt: "desc" },
    include: { sellerOrder: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Returns</h1>
      <div className="space-y-3">
        {returns.map((r) => (
          <div key={r.id} className="rounded-lg border border-[var(--border)] bg-white p-4 text-sm shadow-xs">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-900">{r.sellerOrder.sellerOrderNumber}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{r.status}</span>
            </div>
            <p className="mt-1 text-slate-600">Reason: {r.reason}</p>
            {r.description && <p className="text-slate-500">{r.description}</p>}
            {r.status === "REQUESTED" && <ReturnDecisionButtons returnId={r.id} />}
          </div>
        ))}
      </div>
      {returns.length === 0 && <p className="text-sm text-slate-500">No return requests.</p>}
    </div>
  );
}
