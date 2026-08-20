import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="bg-[var(--brand-ink)] px-4 py-3.5 text-white shadow-md sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          VOLTECH <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-brand-teal">Seller Center</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-white/85 transition-colors hover:text-white">Sign in</Link>
          <Link href="/apply" className="rounded-lg bg-brand-teal px-3.5 py-1.5 font-medium shadow-sm transition-colors hover:bg-brand-teal-dark">
            Become a seller
          </Link>
        </nav>
      </div>
    </header>
  );
}
