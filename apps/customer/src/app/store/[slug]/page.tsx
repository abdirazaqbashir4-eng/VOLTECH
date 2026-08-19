import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import RatingStars from "@/components/RatingStars";
import { toCardData } from "@/lib/catalog";

export async function generateMetadata({ params }: PageProps<"/store/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const seller = await db.sellerProfile.findUnique({ where: { storeSlug: slug } });
  if (!seller) return {};
  return { title: seller.storeName, description: seller.storeDescription, alternates: { canonical: `/store/${slug}` } };
}

export default async function StorePage({ params }: PageProps<"/store/[slug]">) {
  const { slug } = await params;
  const seller = await db.sellerProfile.findUnique({ where: { storeSlug: slug, status: "APPROVED" } });
  if (!seller) notFound();

  const products = await db.product.findMany({
    where: { sellerId: seller.id, status: "APPROVED" },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { where: { status: "ACTIVE" } }, seller: { select: { storeName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 rounded-lg border border-[var(--border)] p-6">
          <h1 className="text-xl font-bold text-slate-900">{seller.storeName}</h1>
          <div className="mt-1 flex items-center gap-2">
            {seller.ratingCount > 0 && <RatingStars value={seller.ratingAvg} count={seller.ratingCount} />}
          </div>
          <p className="mt-2 text-sm text-slate-600">{seller.storeDescription}</p>
        </div>

        <h2 className="mb-3 font-semibold text-slate-900">{products.length} products</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.filter((p) => p.variants.length > 0).map((p) => (
            <ProductCard key={p.slug} product={toCardData(p)} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
