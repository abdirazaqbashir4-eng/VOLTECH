import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import TopAppBar from "@/components/TopAppBar";
import BottomNavBar from "@/components/BottomNavBar";
import Footer from "@/components/Footer";
import FilterSidebar from "@/components/FilterSidebar";
import FilterDrawer from "@/components/FilterDrawer";
import SortSelect from "@/components/SortSelect";
import SearchAddButton from "@/components/SearchAddButton";
import EmptyState from "@/components/EmptyState";
import { queryListing, getFilterOptions, type ListingFilters } from "@/lib/listing";
import { availableStock } from "@voltech/core/marketplace/inventory";
import { formatKES } from "@voltech/core/money";
import { auth } from "@/auth";
import { db } from "@voltech/database";
import { getCartView } from "@voltech/core/marketplace/cart";

export const metadata: Metadata = { title: "Search results" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const brand = typeof sp.brand === "string" ? sp.brand : undefined;
  const minPrice = typeof sp.minPrice === "string" && sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = typeof sp.maxPrice === "string" && sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const minRating = typeof sp.minRating === "string" && sp.minRating ? Number(sp.minRating) : undefined;
  const discountedOnly = sp.discountedOnly === "1";
  const page = typeof sp.page === "string" ? Number(sp.page) : 1;

  const [{ items, total, pageCount }, { brands }, session] = await Promise.all([
    queryListing({ q, sort: sort as ListingFilters["sort"], brand, minPrice, maxPrice, minRating, discountedOnly, page }),
    getFilterOptions(),
    auth(),
  ]);

  if (q && session?.user) {
    await db.searchHistory.create({ data: { userId: session.user.id, query: q } }).catch(() => {});
  }

  const cartCount = session?.user ? (await getCartView(session.user.id)).itemCount : 0;
  const currentBrand = brands.find((b) => b.slug === brand);

  const current = {
    q,
    brand,
    minPrice: sp.minPrice as string,
    maxPrice: sp.maxPrice as string,
    minRating: sp.minRating as string,
    discountedOnly: sp.discountedOnly as string,
    sort,
  };

  const clearParam = (key: string) => {
    const params = new URLSearchParams(Object.entries(current).filter(([k, v]) => v && k !== key) as [string, string][]);
    return `/search?${params.toString()}`;
  };

  const chips: { label: string; href: string }[] = [];
  if (currentBrand) chips.push({ label: `Brand: ${currentBrand.name}`, href: clearParam("brand") });
  if (minRating) chips.push({ label: `Rating: ${minRating}+ Stars`, href: clearParam("minRating") });
  if (minPrice != null || maxPrice != null) {
    const params = new URLSearchParams(
      Object.entries(current).filter(([k, v]) => v && k !== "minPrice" && k !== "maxPrice") as [string, string][],
    );
    chips.push({
      label: `Price: ${minPrice != null ? formatKES(minPrice) : "Any"} - ${maxPrice != null ? formatKES(maxPrice) : "Any"}`,
      href: `/search?${params.toString()}`,
    });
  }
  if (discountedOnly) chips.push({ label: "Discounted only", href: clearParam("discountedOnly") });

  return (
    <>
      <TopAppBar variant="home" />
      <main className="flex-1 w-full flex flex-col px-margin-mobile pt-stack-sm pb-stack-lg gap-stack-md max-w-3xl mx-auto">
        {/* Search bar + filter trigger */}
        <form action="/search" method="get" className="flex gap-stack-xs items-center w-full relative">
          {sort && <input type="hidden" name="sort" value={sort} />}
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search products..."
              type="text"
              className="w-full h-touch-target-min pl-10 pr-4 bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary font-body-md text-body-md text-on-surface"
            />
          </div>
          <FilterDrawer
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                className="w-touch-target-min h-touch-target-min flex items-center justify-center bg-surface-container-low border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container-high active:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined">tune</span>
              </button>
            )}
          >
            <FilterSidebar brands={brands} basePath="/search" current={current} />
          </FilterDrawer>
        </form>

        {/* Desktop filter sidebar */}
        <div className="hidden lg:flex gap-stack-lg items-start">
          <div className="shrink-0">
            <FilterSidebar brands={brands} basePath="/search" current={current} />
          </div>
          <div className="flex-1 flex flex-col gap-stack-md">
            <SearchResultsBody
              chips={chips}
              total={total}
              sort={sort}
              items={items}
              q={q}
              page={page}
              pageCount={pageCount}
              current={current}
            />
          </div>
        </div>

        <div className="lg:hidden">
          <SearchResultsBody
            chips={chips}
            total={total}
            sort={sort}
            items={items}
            q={q}
            page={page}
            pageCount={pageCount}
            current={current}
          />
        </div>
      </main>
      <Footer />
      <BottomNavBar cartCount={cartCount} />
    </>
  );
}

function SearchResultsBody({
  chips,
  total,
  sort,
  items,
  q,
  page,
  pageCount,
  current,
}: {
  chips: { label: string; href: string }[];
  total: number;
  sort?: string;
  items: Awaited<ReturnType<typeof queryListing>>["items"];
  q: string;
  page: number;
  pageCount: number;
  current: Record<string, string | undefined>;
}) {
  const pageHref = (p: number) => {
    const params = new URLSearchParams(Object.entries(current).filter(([, v]) => v) as [string, string][]);
    params.set("page", String(p));
    return `/search?${params.toString()}`;
  };

  return (
    <>
      {chips.length > 0 && (
        <div className="flex overflow-x-auto gap-stack-xs pb-2 -mx-margin-mobile px-margin-mobile hide-scroll snap-x">
          {chips.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="flex-none snap-start flex items-center gap-1 px-3 py-1.5 rounded-full border border-secondary text-secondary font-label-md text-label-md bg-secondary/10"
            >
              {c.label} <span className="material-symbols-outlined text-[14px]">close</span>
            </Link>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center py-stack-xs">
        <span className="font-body-sm text-body-sm text-on-surface-variant">{total} Results</span>
        <SortSelect current={sort} />
      </div>

      {items.length === 0 ? (
        q ? (
          <EmptyState
            icon="🔍"
            title={`No results for "${q}"`}
            description="Check the spelling, try a more general term, or browse by category instead."
            actionHref="/categories"
            actionLabel="Browse categories"
          />
        ) : (
          <EmptyState
            icon="🔍"
            title="No products match these filters"
            description="Try widening your price range or clearing a filter."
            actionHref="/search"
            actionLabel="Clear filters"
          />
        )
      ) : (
        <div className="flex flex-col gap-stack-sm">
          {items.map((p) => {
            const cheapest = p.variants.reduce((min, v) => (v.price < min.price ? v : min), p.variants[0]);
            const totalAvailable = p.variants.reduce((sum, v) => sum + (v.inventory ? availableStock(v.inventory) : 0), 0);
            const inStock = totalAvailable > 0;
            return (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                className="flex gap-stack-sm p-stack-sm bg-surface-container-lowest border border-outline-variant rounded hover:border-secondary transition-colors"
              >
                <div className="w-16 h-16 flex-shrink-0 rounded bg-surface-container-low border border-outline-variant overflow-hidden relative">
                  {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="64px" className="object-cover" />}
                </div>
                <div className="flex-grow flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2">{p.name}</h3>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold whitespace-nowrap">{formatKES(cheapest?.price ?? 0)}</span>
                    </div>
                    {p.ratingCount > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center text-[#eab308] text-[12px]">
                          <span className="material-symbols-outlined text-[14px]">star</span> {p.ratingAvg.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    {inStock ? (
                      <span className="font-label-md text-label-md text-on-tertiary-container px-2 py-1 bg-tertiary-fixed rounded-sm">
                        In Stock {totalAvailable <= 999 ? `(${totalAvailable})` : ""}
                      </span>
                    ) : (
                      <span className="font-label-md text-label-md text-error-industrial px-2 py-1 bg-error-container rounded-sm">Out of Stock</span>
                    )}
                    <SearchAddButton slug={p.slug} disabled={!inStock} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex justify-center gap-2 font-body-sm text-body-sm">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p)}
              className={`rounded px-3 py-1.5 ${p === page ? "bg-secondary text-on-secondary" : "border border-outline-variant text-on-surface-variant hover:border-secondary"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
