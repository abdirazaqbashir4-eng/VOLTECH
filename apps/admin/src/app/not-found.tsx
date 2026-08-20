import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[var(--surface)] px-4 py-24 text-center">
      <span className="font-display text-6xl font-bold text-brand-teal/20" aria-hidden>404</span>
      <h1 className="mt-4 text-lg font-bold text-slate-900">Page not found</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <Link href="/dashboard" className="mt-6 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-teal-dark">
        Back to dashboard
      </Link>
    </main>
  );
}
