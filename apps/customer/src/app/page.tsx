import Link from "next/link";
import Image from "next/image";
import { db } from "@voltech/database";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductCarousel from "@/components/ProductCarousel";
import FlashSaleCard from "@/components/FlashSaleCard";
import HeroCarousel from "@/components/HeroCarousel";
import CountdownTimer from "@/components/CountdownTimer";
import { toCardData } from "@/lib/catalog";
import { SELLER_CENTER_URL } from "@/lib/links";
import { auth } from "@/auth";

const cardInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  variants: { where: { status: "ACTIVE" as const } },
  seller: { select: { storeName: true, status: true } },
};

const flashCardInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  variants: { where: { status: "ACTIVE" as const }, include: { inventory: true } },
  seller: { select: { storeName: true, status: true } },
};

export default async function HomePage() {
  const [categories, popular, newest, flashSaleLinks, session] = await Promise.all([
    db.category.findMany({ where: { status: "ACTIVE", parentId: null }, orderBy: { sortOrder: "asc" }, take: 10 }),
    db.product.findMany({ where: { status: "APPROVED" }, orderBy: { soldCount: "desc" }, take: 12, include: cardInclude }),
    db.product.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 12, include: cardInclude }),
    db.promotionProduct.findMany({
      where: {
        promotion: { scope: "FLASH_SALE", status: "ACTIVE", startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
      },
      include: { product: { include: flashCardInclude }, promotion: { select: { endsAt: true } } },
      take: 10,
    }),
    auth(),
  ]);

  const isAuthenticated = !!session?.user;
  const flashSale = flashSaleLinks.filter((l) => l.product.status === "APPROVED");
  const earliestFlashEnd = flashSale.length
    ? new Date(Math.min(...flashSale.map((l) => l.promotion.endsAt.getTime()))).toISOString()
    : null;

  const stores = await db.sellerProfile.findMany({
    where: { status: "APPROVED" },
    orderBy: { ratingAvg: "desc" },
    take: 6,
  });

  // Real category-tree data, not fabricated copy: the first couple of
  // top-level categories that actually have subcategories become
  // promotional blocks (e.g. "Shop Electronics" -> its real subcategories).
  const promoCategories = await db.category.findMany({
    where: { status: "ACTIVE", parentId: null, children: { some: { status: "ACTIVE" } } },
    orderBy: { sortOrder: "asc" },
    take: 2,
    include: { children: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" }, take: 6 } },
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-[var(--surface)]">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr_260px]">
            <aside className="hidden rounded-lg border border-[var(--border)] bg-white lg:block">
              <ul className="divide-y divide-[var(--border)] text-sm">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/categories/${c.slug}`} className="flex items-center justify-between px-4 py-2.5 text-slate-700 hover:bg-[var(--surface)] hover:text-brand-teal">
                      {c.name}
                      <span aria-hidden className="text-slate-300">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>

            <HeroCarousel />

            <div className="flex flex-col gap-4">
              <div className="flex flex-1 flex-col justify-end rounded-lg bg-brand-teal p-5 text-white">
                <h2 className="text-lg font-bold">Become a seller</h2>
                <p className="mt-1 text-sm text-white/90">Reach thousands of buyers. Set up your store in minutes.</p>
                <a
                  href={`${SELLER_CENTER_URL}/apply`}
                  className="mt-3 inline-flex w-fit items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-brand-teal-dark hover:bg-white/90"
                >
                  Apply now
                </a>
              </div>
              {flashSale.length > 0 && (
                <Link href="#flash-sale" className="flex flex-1 flex-col justify-end rounded-lg bg-red-600 p-5 text-white hover:bg-red-700">
                  <h2 className="text-lg font-bold">Flash Sale is live</h2>
                  <p className="mt-1 text-sm text-white/90">{flashSale.length} deals at limited-time prices.</p>
                  <span className="mt-3 inline-flex w-fit items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-red-700">
                    Shop the sale
                  </span>
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Shop by category</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border)] p-3 text-center text-xs text-slate-700 hover:border-brand-teal hover:text-brand-teal"
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

        {flashSale.length > 0 && earliestFlashEnd && (
          <section id="flash-sale" className="scroll-mt-20 bg-red-50/60 py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900">⚡ Flash Sale</h2>
                  <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">Limited time</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="text-sm">Ends in</span>
                  <CountdownTimer endsAt={earliestFlashEnd} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {flashSale.map((l) => (
                  <FlashSaleCard key={l.product.slug} product={l.product} />
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ProductCarousel title="Popular right now" seeAllHref="/search?sort=popular">
            {popular.map((p) => (
              <div key={p.slug} className="w-[46%] shrink-0 sm:w-[31%] lg:w-[19%]">
                <ProductCard product={toCardData(p)} isAuthenticated={isAuthenticated} />
              </div>
            ))}
          </ProductCarousel>
        </div>

        {promoCategories.map((cat) => (
          <section key={cat.id} className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <div className="rounded-lg border border-[var(--border)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Shop {cat.name}</h2>
                <Link href={`/categories/${cat.slug}`} className="text-sm font-medium text-brand-teal hover:underline">
                  See all
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {cat.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/categories/${child.slug}`}
                    className="flex flex-col items-center gap-2 rounded-md bg-[var(--surface)] p-4 text-center text-xs font-medium text-slate-700 hover:text-brand-teal"
                  >
                    {child.imageUrl ? (
                      <Image src={child.imageUrl} alt={child.name} width={36} height={36} className="h-9 w-9 rounded object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-base font-semibold text-brand-teal">
                        {child.name.charAt(0)}
                      </span>
                    )}
                    <span className="line-clamp-2">{child.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ProductCarousel title="New arrivals" seeAllHref="/search?sort=newest">
            {newest.map((p) => (
              <div key={p.slug} className="w-[46%] shrink-0 sm:w-[31%] lg:w-[19%]">
                <ProductCard product={toCardData(p)} isAuthenticated={isAuthenticated} />
              </div>
            ))}
          </ProductCarousel>
        </div>

        {stores.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
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

