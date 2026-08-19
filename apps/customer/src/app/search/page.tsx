import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSidebar from "@/components/FilterSidebar";
import FilterDrawer from "@/components/FilterDrawer";
import SortSelect from "@/components/SortSelect";
import ProductGrid from "@/components/ProductGrid";
import { queryListing, getFilterOptions, type ListingFilters } from "@/lib/listing";
import { auth } from "@/auth";
import { db } from "@voltech/database";

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

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">{q ? `Results for "${q}"` : "All products"}</h1>
          <SortSelect current={sort} />
        </div>
        <FilterDrawer>
          <FilterSidebar
            brands={brands}
            basePath="/search"
            current={{ q, brand, minPrice: sp.minPrice as string, maxPrice: sp.maxPrice as string, minRating: sp.minRating as string, discountedOnly: sp.discountedOnly as string, sort }}
          />
        </FilterDrawer>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="hidden lg:block">
            <FilterSidebar
              brands={brands}
              basePath="/search"
              current={{ q, brand, minPrice: sp.minPrice as string, maxPrice: sp.maxPrice as string, minRating: sp.minRating as string, discountedOnly: sp.discountedOnly as string, sort }}
            />
          </div>
          <div className="flex-1">
            <ProductGrid
              items={items}
              total={total}
              page={page}
              pageCount={pageCount}
              basePath="/search"
              query={{ q, sort, brand, minPrice: sp.minPrice as string, maxPrice: sp.maxPrice as string, minRating: sp.minRating as string, discountedOnly: sp.discountedOnly as string }}
              isAuthenticated={!!session?.user}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
