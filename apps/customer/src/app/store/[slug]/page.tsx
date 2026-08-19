import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import RatingStars from "@/components/RatingStars";
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

  const [total, products, categories, session] = await Promise.all([
    db.product.count({ where: { sellerId: seller.id, status: "APPROVED" } }),
    db.product.findMany({
      where: { sellerId: seller.id, status: "APPROVED" },
      include,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.category.findMany({
      where: { products: { some: { sellerId: seller.id, status: "APPROVED" } } },
      select: { id: true, name: true, slug: true },
    }),
    auth(),
  ]);

  const items = products.filter((p) => p.variants.length > 0);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

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

        <h2 className="mb-3 mt-8 font-semibold text-slate-900">{total} product{total === 1 ? "" : "s"}</h2>
        <ProductGrid
          items={items}
          total={total}
          page={page}
          pageCount={pageCount}
          basePath={`/store/${slug}`}
          query={{}}
          isAuthenticated={!!session?.user}
        />
      </main>
      <Footer />
    </>
  );
}
