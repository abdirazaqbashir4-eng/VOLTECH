import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { getCartView, getSavedForLaterItems } from "@voltech/core/marketplace/cart";
import { formatKES } from "@voltech/core/money";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartItemRow from "@/components/CartItemRow";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const session = await auth();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl font-bold text-slate-900">Your cart</h1>

        {!session?.user ? (
          <EmptyState icon="🛒" title="Sign in to view your cart" actionHref="/login?callbackUrl=/cart" actionLabel="Sign in" />
        ) : (
          <CartContent userId={session.user.id} />
        )}
      </main>
      <Footer />
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
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {sellerGroups.map((group) => (
          <div key={group.sellerId} className="rounded-lg border border-[var(--border)] p-4">
            <Link href={`/store/${group.storeSlug}`} className="mb-2 inline-block font-medium text-slate-900 hover:text-brand-teal">
              {group.sellerName}
            </Link>
            {group.items.map((item) => (
              <CartItemRow key={item.cartItemId} item={item} />
            ))}
            <p className="mt-2 text-right text-sm text-slate-600">
              Seller subtotal: <span className="font-medium text-slate-900">{formatKES(group.sellerSubtotal)}</span>
            </p>
          </div>
        ))}

        {savedItems.length > 0 && (
          <div>
            <h2 className="mb-2 font-medium text-slate-900">Saved for later</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {savedItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                  <p className="line-clamp-2">{item.product.name}</p>
                  <p className="mt-1 font-semibold">{formatKES(item.variant.price)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {sellerGroups.length > 0 && (
        <div className="h-fit rounded-lg border border-[var(--border)] p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Order summary</h2>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Items ({itemCount})</span>
            <span>{formatKES(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Delivery and taxes calculated at checkout.</p>
          <div className="mt-4 flex justify-between border-t border-[var(--border)] pt-3 font-semibold text-slate-900">
            <span>Subtotal</span>
            <span>{formatKES(subtotal)}</span>
          </div>
          {!allInStock && <p className="mt-2 text-xs text-red-600">Some items exceed available stock — update quantities before checkout.</p>}
          <Link
            href="/checkout"
            aria-disabled={!allInStock}
            className={`mt-4 block rounded-lg py-2.5 text-center font-semibold text-white shadow-sm transition-colors ${allInStock ? "bg-brand-teal hover:bg-brand-teal-dark" : "pointer-events-none bg-slate-300"}`}
          >
            Proceed to checkout
          </Link>
        </div>
      )}
    </div>
  );
}
