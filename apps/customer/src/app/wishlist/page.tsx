import type { Metadata } from "next";
import { db } from "@voltech/database";
import { auth } from "@/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";
import { toCardData } from "@/lib/catalog";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const session = await auth();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl font-bold text-slate-900">Your wishlist</h1>
        {!session?.user ? (
          <EmptyState icon="♡" title="Sign in to view your wishlist" actionHref="/login?callbackUrl=/wishlist" actionLabel="Sign in" />
        ) : (
          <WishlistItems userId={session.user.id} />
        )}
      </main>
      <Footer />
    </>
  );
}

async function WishlistItems({ userId }: { userId: string }) {
  const items = await db.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { where: { status: "ACTIVE" } }, seller: { select: { storeName: true, status: true } } },
      },
    },
  });

  const inStock = items.filter((i) => i.product.status === "APPROVED" && i.product.variants.length > 0);

  if (inStock.length === 0) {
    return (
      <EmptyState
        icon="♡"
        title="Your wishlist is empty"
        description="Save products you like by tapping the heart icon while browsing."
        actionHref="/"
        actionLabel="Start shopping"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {inStock.map((i) => (
        <ProductCard key={i.id} product={toCardData(i.product)} isAuthenticated />
      ))}
    </div>
  );
}
