import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { auth } from "@/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
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
          <div className="rounded-lg border border-[var(--border)] p-8 text-center">
            <p className="mb-4 text-slate-600">Sign in to view your wishlist.</p>
            <Link href="/login?callbackUrl=/wishlist" className="rounded-md bg-brand-teal px-5 py-2.5 font-medium text-white hover:bg-brand-teal-dark">
              Sign in
            </Link>
          </div>
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
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { where: { status: "ACTIVE" } }, seller: { select: { storeName: true } } },
      },
    },
  });

  const inStock = items.filter((i) => i.product.status === "APPROVED" && i.product.variants.length > 0);

  if (inStock.length === 0) {
    return <p className="text-sm text-slate-500">Your wishlist is empty.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {inStock.map((i) => (
        <ProductCard key={i.id} product={toCardData(i.product)} />
      ))}
    </div>
  );
}
