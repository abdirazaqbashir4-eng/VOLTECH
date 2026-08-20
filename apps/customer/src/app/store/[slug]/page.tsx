import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import ProductCard from "@/components/ProductCard";
import RatingStars from "@/components/RatingStars";
import ProductTabs from "@/components/ProductTabs";
import { toCardData } from "@/lib/catalog";
import { auth } from "@/auth";

export async function generateMetadata({ params }: PageProps<"/store/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const seller = await db.sellerProfile.findUnique({ where: { storeSlug: slug } });
  if (!seller) return {};
  return { title: seller.storeName, description: seller.storeDescription, alternates: { canonical: `/store/${slug}` } };
}

export default async function StorePage({ params, searchParams }: PageProps<"/store/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = typeof sp.page === "string" ? Number(sp.page) : 1;
  const pageSize = 24;

  const seller = await db.sellerProfile.findUnique({ where: { storeSlug: slug, status: "APPROVED" } });
  if (!seller) notFound();

  const include = {
    images: { take: 1, orderBy: { sortOrder: "asc" as const } },
    variants: { where: { status: "ACTIVE" as const } },
    seller: { select: { storeName: true, status: true } },
  };

  const [total, products, dealsProducts, categories, reviews, session] = await Promise.all([
    db.product.count({ where: { sellerId: seller.id, status: "APPROVED" } }),
    db.product.findMany({
      where: { sellerId: seller.id, status: "APPROVED" },
      include,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.findMany({
      where: { sellerId: seller.id, status: "APPROVED", variants: { some: { compareAtPrice: { not: null } } } },
      include,
      take: 24,
    }),
    db.category.findMany({
      where: { products: { some: { sellerId: seller.id, status: "APPROVED" } } },
      select: { id: true, name: true, slug: true },
    }),
    db.review.findMany({
      where: { product: { sellerId: seller.id }, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { customer: { select: { fullName: true } }, product: { select: { name: true, slug: true } } },
    }),
    auth(),
  ]);

  const items = products.filter((p) => p.variants.length > 0);
  const deals = dealsProducts.filter((p) => p.variants.length > 0);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const isAuthenticated = !!session?.user;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="overflow-hidden rounded-lg border border-[var(--border)]">
          <div className="h-28 bg-gradient-to-r from-[var(--brand-ink)] to-slate-700 sm:h-36">
            {seller.bannerUrl && (
              <Image src={seller.bannerUrl} alt="" fill={false} width={1200} height={200} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="px-6 pb-6">
            <div className="-mt-8 flex items-end gap-4 sm:-mt-10">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white text-xl font-bold text-brand-teal shadow sm:h-20 sm:w-20">
                {seller.logoUrl ? (
                  <Image src={seller.logoUrl} alt={seller.storeName} width={80} height={80} className="h-full w-full object-cover" />
                ) : (
                  seller.storeName.charAt(0)
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{seller.storeName}</h1>
              <span className="flex items-center gap-1 rounded-full bg-brand-teal/10 px-2 py-0.5 text-xs font-medium text-brand-teal-dark">
                ✓ Verified seller
              </span>
            </div>
            {seller.ratingCount > 0 && <div className="mt-1"><RatingStars value={seller.ratingAvg} count={seller.ratingCount} /></div>}
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{seller.storeDescription}</p>
            <p className="mt-2 text-xs text-slate-400">On VOLTECH since {new Date(seller.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })}</p>

            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/categories/${c.slug}`}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-slate-700 hover:border-brand-teal hover:text-brand-teal"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <ProductTabs
            tabs={[
              {
                id: "products",
                label: `Products (${total})`,
                content: (
                  <ProductGrid
                    items={items}
                    total={total}
                    page={page}
                    pageCount={pageCount}
                    basePath={`/store/${slug}`}
                    query={{}}
                    isAuthenticated={isAuthenticated}
                  />
                ),
              },
              {
                id: "deals",
                label: `Deals${deals.length > 0 ? ` (${deals.length})` : ""}`,
                content:
                  deals.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">No active deals from this seller right now.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {deals.map((p) => (
                        <ProductCard key={p.slug} product={toCardData(p)} isAuthenticated={isAuthenticated} />
                      ))}
                    </div>
                  ),
              },
              {
                id: "reviews",
                label: `Reviews${seller.ratingCount > 0 ? ` (${seller.ratingCount})` : ""}`,
                content:
                  reviews.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">No reviews yet.</p>
                  ) : (
                    <div className="max-w-2xl space-y-4">
                      {reviews.map((r) => (
                        <div key={r.id} className="border-b border-[var(--border)] pb-4">
                          <div className="flex items-center gap-2">
                            <RatingStars value={r.rating} />
                            <span className="text-sm font-medium text-slate-800">{r.customer.fullName}</span>
                            {r.verifiedPurchase && <span className="text-xs text-green-700">Verified purchase</span>}
                          </div>
                          <Link href={`/products/${r.product.slug}`} className="mt-1 block text-xs text-brand-teal hover:underline">
                            {r.product.name}
                          </Link>
                          {r.title && <p className="mt-1 font-medium text-slate-900">{r.title}</p>}
                          {r.body && <p className="mt-1 text-sm text-slate-600">{r.body}</p>}
                        </div>
                      ))}
                    </div>
                  ),
              },
              {
                id: "about",
                label: "About",
                content: (
                  <div className="max-w-2xl space-y-4 text-sm text-slate-700">
                    <p>{seller.storeDescription}</p>
                    <dl className="grid grid-cols-2 gap-4 rounded-lg border border-[var(--border)] p-4 sm:grid-cols-3">
                      <div>
                        <dt className="text-xs text-slate-400">Rating</dt>
                        <dd className="font-medium text-slate-900">{seller.ratingCount > 0 ? `${seller.ratingAvg.toFixed(1)}★ (${seller.ratingCount})` : "No ratings yet"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-400">Products</dt>
                        <dd className="font-medium text-slate-900">{total}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-400">Seller since</dt>
                        <dd className="font-medium text-slate-900">{new Date(seller.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short" })}</dd>
                      </div>
                    </dl>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
