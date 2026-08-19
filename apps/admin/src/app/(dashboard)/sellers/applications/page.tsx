import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Seller applications" };

export default async function SellerApplicationsPage() {
  await requireAdmin();
  const applications = await db.sellerApplication.findMany({ orderBy: { submittedAt: "desc" }, include: { user: true } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Seller applications</h1>
      <div className="space-y-3">
        {applications.map((a) => (
          <Link
            key={a.id}
            href={`/sellers/applications/${a.id}`}
            className="block rounded-lg border border-[var(--border)] bg-white p-4 hover:border-brand-teal"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{a.storeName}</p>
                <p className="text-xs text-slate-500">{a.user.email} — submitted {new Date(a.submittedAt).toLocaleDateString()}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === "SUBMITTED" ? "bg-amber-100 text-amber-700" : a.status === "APPROVED" ? "bg-green-100 text-green-700" : a.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-slate-100"}`}>
                {a.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {applications.length === 0 && <p className="text-sm text-slate-500">No applications yet.</p>}
    </div>
  );
}
