import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <span className="font-display text-6xl font-bold text-brand-teal/20" aria-hidden>404</span>
        <h1 className="mt-4 text-lg font-bold text-slate-900">Page not found</h1>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/" className="rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-teal-dark">
            Back to home
          </Link>
          <Link href="/search" className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-brand-teal">
            Search products
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
