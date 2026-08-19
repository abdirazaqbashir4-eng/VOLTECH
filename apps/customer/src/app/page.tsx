import Link from "next/link";
import Image from "next/image";
import { db } from "@voltech/database";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { toCardData } from "@/lib/catalog";
import { SELLER_CENTER_URL } from "@/lib/links";

const cardInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  variants: { where: { status: "ACTIVE" as const } },
  seller: { select: { storeName: true } },
};

export default async function HomePage() {
  const [categories, popular, newest, flashSaleLinks] = await Promise.all([
    db.category.findMany({ where: { status: "ACTIVE", parentId: null }, orderBy: { sortOrder: "asc" }, take: 8 }),
    db.product.findMany({ where: { status: "APPROVED" }, orderBy: { soldCount: "desc" }, take: 10, include: cardInclude }),
    db.product.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 10, include: cardInclude }),
    db.promotionProduct.findMany({
      where: {
        promotion: { scope: "FLASH_SALE", status: "ACTIVE", startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
      },
      include: { product: { include: cardInclude } },
      take: 10,
    }),
  ]);

  const flashSale = flashSaleLinks.filter((l) => l.product.status === "APPROVED").map((l) => l.product);
  const stores = await db.sellerProfile.findMany({
    where: { status: "APPROVED" },
    orderBy: { ratingAvg: "desc" },
    take: 6,
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-[var(--surface)]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-xl bg-gradient-to-br from-[var(--brand-ink)] to-slate-700 p-6 text-white sm:col-span-2">
                <h1 className="max-w-md text-3xl font-bold leading-tight">Shop thousands of products from trusted local sellers</h1>
                <p className="mt-2 max-w-sm text-white/80">Electronics, fashion, home goods and more — delivered across Kenya.</p>
                <Link
                  href="/categories"
                  className="mt-4 inline-flex w-fit items-center rounded-md bg-brand-amber px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-amber-dark"
                >
                  Start shopping
                </Link>
              </div>
              <div className="flex min-h-[220px] flex-col justify-end rounded-xl bg-brand-teal p-6 text-white">
                <h2 className="text-xl font-bold">Become a seller</h2>
                <p className="mt-1 text-sm text-white/90">Reach thousands of buyers. Set up your store in minutes.</p>
                <a
                  href={`${SELLER_CENTER_URL}/apply`}
                  className="mt-4 inline-flex w-fit items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-brand-teal-dark hover:bg-white/90"
                >
                  Apply now
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Shop by category</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border)] p-4 text-center text-sm text-slate-700 hover:border-brand-teal hover:text-brand-teal"
              >
                {c.imageUrl ? (
                  <Image src={c.imageUrl} alt={c.name} width={40} height={40} className="h-10 w-10 rounded object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-lg font-semibold text-brand-teal">
                    {c.name.charAt(0)}
                  </span>
                )}
                <span className="line-clamp-2">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {flashSale.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">Flash Sale</h2>
              <span className="rounded bg-brand-amber px-2 py-0.5 text-xs font-semibold text-brand-ink">Limited time</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {flashSale.map((p) => (
                <ProductCard key={p.slug} product={toCardData(p)} />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Popular products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {popular.map((p) => (
              <ProductCard key={p.slug} product={toCardData(p)} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">New arrivals</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {newest.map((p) => (
              <ProductCard key={p.slug} product={toCardData(p)} />
            ))}
          </div>
        </section>

        {stores.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Featured stores</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {stores.map((s) => (
                <Link
                  key={s.id}
                  href={`/store/${s.storeSlug}`}
                  className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border)] p-4 text-center hover:border-brand-teal"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-lg font-semibold text-brand-teal">
                    {s.storeName.charAt(0)}
                  </span>
                  <span className="line-clamp-1 text-sm font-medium text-slate-800">{s.storeName}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
