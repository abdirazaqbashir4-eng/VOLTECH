import Link from "next/link";
import { Suspense } from "react";
import { db } from "@voltech/database";
import { auth, signOut } from "@/auth";
import { getCartView } from "@voltech/core/marketplace/cart";
import SearchBar from "./SearchBar";

export default async function Header() {
  const session = await auth();
  const categories = await db.category.findMany({
    where: { status: "ACTIVE", parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 8,
  });

  let cartCount = 0;
  if (session?.user) {
    const cart = await getCartView(session.user.id);
    cartCount = cart.itemCount;
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--brand-ink)] text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight">
          VOLTECH
        </Link>

        <div className="hidden flex-1 md:block">
          <Suspense fallback={<div className="h-9 w-full max-w-2xl rounded-md bg-white/10" />}>
            <SearchBar />
          </Suspense>
        </div>

        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/wishlist" className="hidden sm:inline hover:text-brand-teal">
            Wishlist
          </Link>

          {session?.user ? (
            <div className="group relative">
              <Link href="/account" className="hover:text-brand-teal">
                {session.user.name?.split(" ")[0] ?? "Account"}
              </Link>
            </div>
          ) : (
            <Link href="/login" className="hover:text-brand-teal">
              Sign in
            </Link>
          )}

          <Link href="/cart" className="flex items-center gap-1 hover:text-brand-teal">
            Cart
            {cartCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-amber px-1.5 text-xs font-semibold text-brand-ink">
                {cartCount}
              </span>
            )}
          </Link>

          {session?.user && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="hidden text-white/70 hover:text-white sm:inline">
                Sign out
              </button>
            </form>
          )}
        </nav>
      </div>

      <div className="border-t border-white/10 bg-brand-ink/95">
        <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-2 text-sm text-white/80 sm:px-6">
          <Link href="/categories" className="shrink-0 font-medium text-white">
            All Categories
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="shrink-0 hover:text-white">
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <Suspense fallback={<div className="h-9 w-full rounded-md bg-white/10" />}>
          <SearchBar />
        </Suspense>
      </div>
    </header>
  );
}
