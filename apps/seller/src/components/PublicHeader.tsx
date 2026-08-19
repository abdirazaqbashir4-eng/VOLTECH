import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--brand-ink)] px-4 py-3 text-white sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="text-lg font-bold">
          VOLTECH <span className="text-brand-teal">Seller Center</span>
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/login" className="hover:text-brand-teal">Sign in</Link>
          <Link href="/apply" className="rounded-md bg-brand-teal px-3 py-1.5 font-medium hover:bg-brand-teal-dark">
            Become a seller
          </Link>
        </nav>
      </div>
    </header>
  );
}
