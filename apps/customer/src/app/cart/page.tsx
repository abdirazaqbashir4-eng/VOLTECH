import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { getCartView, getSavedForLaterItems } from "@voltech/core/marketplace/cart";
import { formatKES } from "@voltech/core/money";
import TopAppBar from "@/components/TopAppBar";
import BottomNavBar from "@/components/BottomNavBar";
import Footer from "@/components/Footer";
import CartItemRow from "@/components/CartItemRow";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const session = await auth();
  const cartCount = session?.user ? (await getCartView(session.user.id)).itemCount : 0;

  return (
    <>
      <TopAppBar variant="home" />
      <main className="flex-grow p-margin-mobile flex flex-col gap-stack-lg pb-32">
        {!session?.user ? (
          <EmptyState icon="🛒" title="Sign in to view your cart" actionHref="/login?callbackUrl=/cart" actionLabel="Sign in" />
        ) : (
          <CartContent userId={session.user.id} />
        )}
      </main>
      <Footer />
      <BottomNavBar cartCount={cartCount} />
    </>
  );
}

async function CartContent({ userId }: { userId: string }) {
  const [{ sellerGroups, subtotal, itemCount }, savedItems] = await Promise.all([getCartView(userId), getSavedForLaterItems(userId)]);

  if (sellerGroups.length === 0 && savedItems.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Your cart is empty"
        description="Browse the marketplace and add items to get started."
        actionHref="/"
        actionLabel="Continue shopping"
      />
    );
  }

  const allInStock = sellerGroups.every((g) => g.items.every((i) => i.inStock));

  return (
    <>
      <section className="flex flex-col gap-stack-md">
        <h2 className="font-headline-md text-headline-md">Your Cart ({itemCount})</h2>
        {sellerGroups.map((group) => (
          <div key={group.sellerId} className="flex flex-col gap-stack-md">
            <Link href={`/store/${group.storeSlug}`} className="font-label-md text-label-md text-secondary uppercase">
              {group.sellerName}
            </Link>
            {group.items.map((item) => (
              <CartItemRow key={item.cartItemId} item={item} />
            ))}
            <p className="text-right font-body-sm text-body-sm text-on-surface-variant">
              Seller subtotal: <span className="font-semibold text-on-surface">{formatKES(group.sellerSubtotal)}</span>
            </p>
          </div>
        ))}
      </section>

      {savedItems.length > 0 && (
        <section className="flex flex-col gap-stack-md">
          <h3 className="font-headline-sm text-headline-sm">Saved for later</h3>
          <div className="grid grid-cols-2 gap-gutter-mobile sm:grid-cols-3">
            {savedItems.map((item) => (
              <div key={item.id} className="bg-surface-container-lowest border border-outline-variant rounded p-stack-sm">
                <p className="font-body-sm text-body-sm line-clamp-2">{item.product.name}</p>
                <p className="mt-1 font-headline-sm text-headline-sm">{formatKES(item.variant.price)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {sellerGroups.length > 0 && (
        <>
          <section className="bg-surface-container-lowest border border-outline-variant rounded p-stack-md flex flex-col gap-stack-sm">
            <h3 className="font-headline-sm text-headline-sm mb-2">Order Summary</h3>
            <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
              <span>Subtotal ({itemCount} items)</span>
              <span>{formatKES(subtotal)}</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Delivery and taxes calculated at checkout.</p>
            <hr className="border-t border-outline-variant my-2" />
            <div className="flex justify-between font-headline-sm text-headline-sm">
              <span>Subtotal</span>
              <span>{formatKES(subtotal)}</span>
            </div>
            {!allInStock && <p className="font-body-sm text-body-sm text-error">Some items exceed available stock — update quantities before checkout.</p>}
          </section>

          {/* Sticky Checkout Button — matches voltech_shopping_cart_mobile exactly. */}
          <div className="fixed bottom-16 left-0 w-full bg-surface-container-lowest border-t border-outline-variant p-margin-mobile z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            <Link
              href="/checkout"
              aria-disabled={!allInStock}
              className={`w-full h-touch-target-min font-label-lg text-label-lg rounded flex items-center justify-center gap-2 ${
                allInStock ? "bg-secondary text-on-secondary active:opacity-90" : "pointer-events-none bg-surface-container-high text-on-surface-variant"
              }`}
            >
              Proceed to Checkout <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </>
      )}
    </>
  );
}
