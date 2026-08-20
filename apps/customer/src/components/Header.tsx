import Link from "next/link";
import { Suspense } from "react";
import { db } from "@voltech/database";
import { auth, signOut } from "@/auth";
import { getCartView } from "@voltech/core/marketplace/cart";
import { SELLER_CENTER_URL } from "@/lib/links";
import SearchBar from "./SearchBar";
import MobileMenu from "./MobileMenu";
import MegaMenu from "./MegaMenu";
import NotificationBell from "./NotificationBell";
import AccountMenu from "./AccountMenu";

export default async function Header() {
  const session = await auth();
  const categories = await db.category.findMany({
    where: { status: "ACTIVE", parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 10,
    include: { children: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" }, take: 8 } },
  });

  let cartCount = 0;
  let notifications: { id: string; title: string; body: string; linkUrl: string | null; readAt: Date | null; createdAt: Date }[] = [];
  let unreadCount = 0;
  if (session?.user) {
    const [cart, notifs, unread] = await Promise.all([
      getCartView(session.user.id),
      db.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
      db.notification.count({ where: { userId: session.user.id, readAt: null } }),
    ]);
    cartCount = cart.itemCount;
    notifications = notifs;
    unreadCount = unread;
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--brand-ink)] text-white shadow-md">
      <div className="hidden border-b border-white/[0.06] md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-white/60 sm:px-6">
          <div className="flex items-center gap-5">
            <Link href="/help" className="transition-colors hover:text-white">Help</Link>
            <a href={`${SELLER_CENTER_URL}/apply`} className="transition-colors hover:text-white">Sell on VOLTECH</a>
            <a href={`${SELLER_CENTER_URL}/login`} className="transition-colors hover:text-white">Seller Center</a>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/account/orders" className="transition-colors hover:text-white">Track order</Link>
            <Link href="/about" className="transition-colors hover:text-white">About us</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:px-6">
        <MobileMenu
          categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
          isAuthenticated={!!session?.user}
          userName={session?.user?.name?.split(" ")[0] ?? null}
          sellerCenterUrl={SELLER_CENTER_URL}
        />

        <Link href="/" className="flex shrink-0 items-center gap-1.5 font-display text-xl font-bold tracking-tight">
          VOLTECH
          <span aria-hidden className="mb-2.5 h-1.5 w-1.5 rounded-full bg-brand-amber" />
        </Link>

        <div className="hidden flex-1 md:block">
          <Suspense fallback={<div className="h-10 w-full max-w-2xl rounded-md bg-white/10" />}>
            <SearchBar />
          </Suspense>
        </div>

        <nav className="ml-auto flex items-center gap-5 text-sm">
          <Link href="/wishlist" className="hidden items-center gap-1.5 text-white/85 transition-colors hover:text-white sm:flex">
            <span aria-hidden>♡</span> Wishlist
          </Link>

          {session?.user && <NotificationBell items={notifications.map((n) => ({ ...n, linkUrl: n.linkUrl, readAt: n.readAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString() }))} unreadCount={unreadCount} />}

          {session?.user ? (
            <AccountMenu
              userName={session.user.name || "Account"}
              onSignOut={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            />
          ) : (
            <Link href="/login" className="hidden text-white/85 transition-colors hover:text-white sm:inline">
              Sign in
            </Link>
          )}

          <Link href="/cart" className="flex items-center gap-1.5 text-white/85 transition-colors hover:text-white">
            <span aria-hidden className="text-lg leading-none">🛒</span>
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-amber px-1.5 text-xs font-semibold text-brand-ink">
                {cartCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      <div className="border-t border-white/[0.06] bg-[var(--brand-ink-2)]">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2.5 text-sm text-white/75 sm:px-6">
          <MegaMenu categories={categories} />
          {categories.map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="shrink-0 transition-colors hover:text-white">
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <Suspense fallback={<div className="h-10 w-full rounded-md bg-white/10" />}>
          <SearchBar />
        </Suspense>
      </div>
    </header>
  );
}
