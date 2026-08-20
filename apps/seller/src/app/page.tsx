import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";

export default function SellerLandingPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <section className="bg-[var(--brand-ink)] px-4 py-20 text-center text-white sm:px-6">
          <h1 className="mx-auto max-w-2xl text-3xl font-bold">Sell to thousands of shoppers on VOLTECH</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            List products, manage orders and inventory, and get paid — all from one seller dashboard.
          </p>
          <Link href="/apply" className="mt-6 inline-block rounded-lg bg-brand-amber shadow-sm transition-colors px-6 py-3 font-semibold text-brand-ink hover:bg-brand-amber-dark">
            Apply to sell
          </Link>
        </section>
        <section className="mx-auto grid max-w-4xl gap-6 px-4 py-14 sm:grid-cols-3 sm:px-6">
          <div>
            <p className="text-2xl">🛍️</p>
            <h2 className="mt-2 font-semibold text-slate-900">List products</h2>
            <p className="mt-1 text-sm text-slate-600">Add products with variants, images, and pricing in minutes.</p>
          </div>
          <div>
            <p className="text-2xl">📦</p>
            <h2 className="mt-2 font-semibold text-slate-900">Manage orders</h2>
            <p className="mt-1 text-sm text-slate-600">Track and fulfill orders with real-time inventory sync.</p>
          </div>
          <div>
            <p className="text-2xl">💰</p>
            <h2 className="mt-2 font-semibold text-slate-900">Get paid</h2>
            <p className="mt-1 text-sm text-slate-600">Transparent commissions and scheduled payouts to M-Pesa or your bank.</p>
          </div>
        </section>
      </main>
    </>
  );
}
