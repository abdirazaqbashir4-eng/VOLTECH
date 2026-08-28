import Link from "next/link";
import type { Metadata } from "next";
import { auth, signOut } from "@/auth";
import { db } from "@voltech/database";

export const metadata: Metadata = { title: "My account" };

export default async function AccountOverviewPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [orderCount, wishlistCount, reviewCount] = await Promise.all([
    db.order.count({ where: { customerId: session.user.id } }),
    db.wishlistItem.count({ where: { userId: session.user.id } }),
    db.review.count({ where: { customerId: session.user.id } }),
  ]);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div>
      {/* Profile Hero */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl px-margin-mobile py-stack-lg mb-stack-md">
        <div className="flex items-center gap-margin-mobile mb-stack-lg">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-surface-container-high bg-surface-container flex-shrink-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{session.user.name}</h1>
            <div className="flex items-center gap-stack-xs mt-1">
              <span className="font-body-sm text-body-sm text-on-surface-variant">{session.user.email}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-margin-mobile">
          <Link href="/account/orders" className="flex-1 bg-surface-container-low rounded-lg p-stack-sm flex flex-col items-center justify-center border border-surface-variant">
            <span className="font-headline-md text-headline-md text-primary">{orderCount}</span>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Orders</span>
          </Link>
          <Link href="/wishlist" className="flex-1 bg-surface-container-low rounded-lg p-stack-sm flex flex-col items-center justify-center border border-surface-variant">
            <span className="font-headline-md text-headline-md text-primary">{wishlistCount}</span>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Wishlist</span>
          </Link>
          <div className="flex-1 bg-surface-container-low rounded-lg p-stack-sm flex flex-col items-center justify-center border border-surface-variant">
            <span className="font-headline-md text-headline-md text-primary">{reviewCount}</span>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Reviews</span>
          </div>
        </div>
      </section>

      {/* Navigation Menu Groups */}
      <div className="flex flex-col gap-stack-md pb-stack-lg">
        <MenuGroup title="Account Settings">
          <MenuLink href="/account/addresses" icon="location_on" label="Addresses" />
          <MenuLink href="/account/orders" icon="receipt_long" label="Order History" last />
        </MenuGroup>

        <MenuGroup title="Security">
          <MenuLink href="/account/settings" icon="lock" label="Password & Security" last />
        </MenuGroup>

        <MenuGroup title="Marketplace Preferences">
          <MenuLink href="/account/notifications" icon="notifications_active" label="Notification Preferences" last />
        </MenuGroup>

        <form action={handleSignOut}>
          <button
            type="submit"
            className="w-full bg-surface-container-lowest border border-error text-error font-headline-sm text-headline-sm rounded-lg h-[48px] flex items-center justify-center hover:bg-error-container transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined mr-2">logout</span> Log Out
          </button>
        </form>
      </div>
    </div>
  );
}

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
      <div className="bg-surface-container-low px-stack-md py-stack-sm border-b border-outline-variant">
        <h2 className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest">{title}</h2>
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function MenuLink({ href, icon, label, last }: { href: string; icon: string; label: string; last?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center px-stack-md py-stack-sm hover:bg-surface-container-high transition-colors active:bg-surface-variant min-h-[48px] ${!last ? "border-b border-outline-variant" : ""}`}
    >
      <span className="material-symbols-outlined text-on-surface-variant mr-stack-md">{icon}</span>
      <span className="font-body-md text-body-md text-on-surface flex-1 text-left">{label}</span>
      <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
    </Link>
  );
}
