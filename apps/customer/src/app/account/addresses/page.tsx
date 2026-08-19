import type { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@voltech/database";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const addresses = await db.address.findMany({ where: { userId: session.user.id }, orderBy: { isDefault: "desc" } });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-900">Addresses</h1>
      {addresses.length === 0 ? (
        <p className="text-sm text-slate-500">No saved addresses yet. Add one during checkout.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-lg border border-[var(--border)] p-4 text-sm">
              <p className="font-medium text-slate-900">
                {a.label} {a.isDefault && <span className="ml-1 rounded bg-brand-teal/10 px-1.5 py-0.5 text-xs text-brand-teal-dark">Default</span>}
              </p>
              <p className="text-slate-600">{a.recipientName} — {a.phone}</p>
              <p className="text-slate-600">{a.street}, {a.city}, {a.county}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
