import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";
import ReviewModerationButtons from "@/components/ReviewModerationButtons";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  await requireAdmin();
  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: { select: { name: true } }, customer: { select: { fullName: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Reviews</h1>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-lg border border-[var(--border)] bg-white p-4 text-sm shadow-xs">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-900">{r.product.name}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{r.status}</span>
            </div>
            <p className="text-slate-500">{r.customer.fullName} — {"★".repeat(r.rating)}</p>
            {r.body && <p className="mt-1 text-slate-700">{r.body}</p>}
            <div className="mt-2"><ReviewModerationButtons reviewId={r.id} status={r.status} /></div>
          </div>
        ))}
      </div>
      {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
    </div>
  );
}
