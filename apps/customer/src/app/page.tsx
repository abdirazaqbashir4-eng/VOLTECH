import Link from "next/link";
import Image from "next/image";
import { db } from "@voltech/database";
import { formatKES } from "@voltech/core/money";
import TopAppBar from "@/components/TopAppBar";
import BottomNavBar from "@/components/BottomNavBar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductCarousel from "@/components/ProductCarousel";
import { toCardData } from "@/lib/catalog";
import { SELLER_CENTER_URL } from "@/lib/links";
import { auth } from "@/auth";
import { getCartView } from "@voltech/core/marketplace/cart";

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

const CATEGORY_ICONS: Record<string, string> = {
  "Phones & Tablets": "smartphone",
  Electronics: "headphones",
  Computing: "laptop_mac",
  Fashion: "checkroom",
  "Home & Living": "chair",
  "Beauty & Personal Care": "spa",
  Gaming: "sports_esports",
};

export default async function HomePage() {
  const [categories, popular, newest, flashSaleLinks, activePromo, session] = await Promise.all([
    db.category.findMany({ where: { status: "ACTIVE", parentId: null }, orderBy: { sortOrder: "asc" }, take: 8 }),
    db.product.findMany({ where: { status: "APPROVED" }, orderBy: { soldCount: "desc" }, take: 12, include: cardInclude }),
    db.product.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 12, include: cardInclude }),
    db.promotionProduct.findMany({
      where: {
        promotion: { scope: "FLASH_SALE", status: "ACTIVE", startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
      },
      include: { product: { include: flashCardInclude }, promotion: { select: { endsAt: true } } },
      take: 5,
    }),
    db.promotion.findFirst({
      where: { scope: "PLATFORM", status: "ACTIVE", startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    auth(),
  ]);

  const isAuthenticated = !!session?.user;
  const flashSale = flashSaleLinks.filter((l) => l.product.status === "APPROVED");
  const cartCount = session?.user ? (await getCartView(session.user.id)).itemCount : 0;

  const stores = await db.sellerProfile.findMany({
    where: { status: "APPROVED" },
    orderBy: { ratingAvg: "desc" },
    take: 6,
  });

  const promoCategories = await db.category.findMany({
    where: { status: "ACTIVE", parentId: null, children: { some: { status: "ACTIVE" } } },
    orderBy: { sortOrder: "asc" },
    take: 2,
    include: { children: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" }, take: 6 } },
  });

  return (
    <>
      <TopAppBar variant="home" />
      <main className="w-full max-w-[480px] mx-auto md:max-w-none px-margin-mobile pt-stack-md pb-24 flex flex-col gap-stack-lg">
        {/* Search Bar */}
        <Link href="/search" className="relative w-full block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <div className="w-full bg-surface-container-lowest border border-outline-variant rounded h-[44px] pl-10 pr-4 flex items-center font-body-md text-body-md text-on-surface-variant">
            Search products, brands and more...
          </div>
        </Link>

        {/* Promo Banner */}
        <section className="w-full relative min-h-[150px] rounded overflow-hidden bg-primary-container">
          <div className="absolute inset-0 flex flex-col justify-center px-6 py-6">
            {activePromo ? (
              <>
                <span className="bg-error text-on-error font-label-md text-label-md px-2 py-1 rounded inline-flex w-fit mb-2 uppercase">Live Now</span>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary font-black mb-1">{activePromo.name}</h2>
                <p className="font-body-sm text-body-sm text-on-primary/90">
                  {activePromo.discountType === "PERCENTAGE" ? `${activePromo.discountValue}% off` : `${formatKES(activePromo.discountValue)} off`} storewide.
                </p>
              </>
            ) : (
              <>
                <span className="bg-secondary text-on-secondary font-label-md text-label-md px-2 py-1 rounded inline-flex w-fit mb-2 uppercase">VOLTECH</span>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary font-black mb-1">Shop trusted local sellers</h2>
                <p className="font-body-sm text-body-sm text-on-primary/90">Electronics, fashion, home goods and more — delivered across Kenya.</p>
              </>
            )}
          </div>
        </section>

        {/* Departments */}
        <section className="w-full">
          <div className="flex justify-between items-end mb-stack-sm">
            <h3 className="font-headline-sm text-headline-sm">Departments</h3>
            <Link href="/categories" className="font-label-md text-label-md text-secondary uppercase">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-gutter-mobile">
            {categories.slice(0, 4).map((c) => (
              <Link key={c.id} href={`/categories/${c.slug}`} className="flex flex-col items-center gap-stack-xs active:scale-95 transition-transform">
                <div className="w-full aspect-square bg-surface-container-low border border-outline-variant rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-[28px]">{CATEGORY_ICONS[c.name] ?? "category"}</span>
                </div>
                <span className="font-label-md text-label-md text-center line-clamp-1">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Flash Sale Bento Grid */}
        {flashSale.length > 0 && (
          <section className="w-full">
            <div className="flex justify-between items-center mb-stack-sm">
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-headline-sm text-error">Flash Sale</h3>
              </div>
              <Link href="/search?sort=discount" className="font-label-md text-label-md text-secondary uppercase">
                See All
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-gutter-mobile">
              {flashSale.slice(0, 3).map((l, i) => {
                const variant = l.product.variants.reduce((min, v) => (v.price < min.price ? v : min), l.product.variants[0]);
                const discountPct = variant.compareAtPrice ? Math.round(((variant.compareAtPrice - variant.price) / variant.compareAtPrice) * 100) : null;
                const isLarge = i === 0;
                return (
                  <Link
                    key={l.product.slug}
                    href={`/products/${l.product.slug}`}
                    className={`bg-surface-container-lowest border border-outline-variant rounded overflow-hidden flex ${
                      isLarge ? "col-span-2 flex-row h-[140px]" : "flex-col p-2 h-[180px]"
                    }`}
                  >
                    <div className={isLarge ? "w-[120px] flex-shrink-0 relative" : "w-full h-[80px] relative mb-2"}>
                      {l.product.images[0] && (
                        <Image src={l.product.images[0].url} alt={l.product.name} fill sizes="120px" className="object-cover" />
                      )}
                      {discountPct !== null && (
                        <span className="absolute top-2 left-2 bg-error text-on-error font-label-md text-label-md px-1.5 py-0.5 rounded">-{discountPct}%</span>
                      )}
                    </div>
                    {isLarge ? (
                      <div className="p-2 flex flex-col justify-between flex-1">
                        <div>
                          <h4 className="font-body-md text-body-md line-clamp-2 mb-1">{l.product.name}</h4>
                          <div className="flex items-baseline gap-2">
                            <span className="font-headline-sm text-headline-sm">{formatKES(variant.price)}</span>
                            {variant.compareAtPrice && (
                              <span className="font-body-sm text-body-sm text-on-surface-variant line-through">{formatKES(variant.compareAtPrice)}</span>
                            )}
                          </div>
                        </div>
                        <span className="w-full h-[36px] bg-secondary text-on-secondary rounded font-label-md text-label-md flex items-center justify-center gap-1 mt-2">
                          <span className="material-symbols-outlined text-[18px]">shopping_cart</span> Add
                        </span>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-body-sm text-body-sm line-clamp-2 mb-1 flex-1">{l.product.name}</h4>
                        <span className="font-headline-sm text-headline-sm">{formatKES(variant.price)}</span>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Trending / Popular */}
        {popular.length > 0 && (
          <div>
            <ProductCarousel title="Popular right now" seeAllHref="/search?sort=popular">
              {popular.slice(0, 8).map((p) => (
                <div key={p.slug} className="w-[46%] shrink-0">
                  <ProductCard product={toCardData(p)} isAuthenticated={isAuthenticated} />
                </div>
              ))}
            </ProductCarousel>
          </div>
        )}

        {/* Become a seller */}
        <section className="w-full bg-surface-container-lowest border border-outline-variant rounded p-margin-mobile flex flex-col">
          <h3 className="font-headline-sm text-headline-sm">Become a seller</h3>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Reach thousands of buyers. Set up your store in minutes.</p>
          <a
            href={`${SELLER_CENTER_URL}/apply`}
            className="mt-3 inline-flex w-fit items-center rounded bg-secondary px-4 py-2 font-label-lg text-label-lg text-on-secondary"
          >
            Apply now
          </a>
        </section>

        <ProductCarousel title="New arrivals" seeAllHref="/search?sort=newest">
          {newest.slice(0, 8).map((p) => (
            <div key={p.slug} className="w-[46%] shrink-0">
              <ProductCard product={toCardData(p)} isAuthenticated={isAuthenticated} />
            </div>
          ))}
        </ProductCarousel>

        {promoCategories.map((cat) => (
          <section key={cat.id} className="w-full bg-surface-container-lowest border border-outline-variant rounded p-margin-mobile">
            <div className="mb-stack-sm flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm">Shop {cat.name}</h3>
              <Link href={`/categories/${cat.slug}`} className="font-label-md text-label-md text-secondary uppercase">
                See all
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-gutter-mobile">
              {cat.children.map((child) => (
                <Link key={child.id} href={`/categories/${child.slug}`} className="flex flex-col items-center gap-stack-xs">
                  <div className="w-full aspect-square bg-surface-container-low border border-outline-variant rounded flex items-center justify-center overflow-hidden">
                    {child.imageUrl ? (
                      <Image src={child.imageUrl} alt={child.name} width={36} height={36} className="h-9 w-9 object-cover" />
                    ) : (
                      <span className="font-headline-sm text-headline-sm text-on-surface-variant">{child.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="font-label-md text-label-md text-center line-clamp-2">{child.name}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {stores.length > 0 && (
          <section className="w-full">
            <h3 className="font-headline-sm text-headline-sm mb-stack-sm">Featured stores</h3>
            <div className="grid grid-cols-3 gap-gutter-mobile">
              {stores.map((s) => (
                <Link key={s.id} href={`/store/${s.storeSlug}`} className="flex flex-col items-center gap-stack-xs bg-surface-container-lowest border border-outline-variant rounded p-stack-md">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high font-headline-sm text-headline-sm text-secondary">
                    {s.storeName.charAt(0)}
                  </span>
                  <span className="line-clamp-1 font-label-md text-label-md text-center">{s.storeName}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <BottomNavBar cartCount={cartCount} />
    </>
  );
}
