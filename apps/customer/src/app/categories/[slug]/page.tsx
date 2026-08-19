import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSidebar from "@/components/FilterSidebar";
import SortSelect from "@/components/SortSelect";
import ProductGrid from "@/components/ProductGrid";
import { queryListing, getFilterOptions, type ListingFilters } from "@/lib/listing";

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.category.findUnique({ where: { slug } });
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name} on VOLTECH.`,
    alternates: { canonical: `/categories/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await db.category.findUnique({ where: { slug, status: "ACTIVE" } });
  if (!category) notFound();

  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const brand = typeof sp.brand === "string" ? sp.brand : undefined;
  const minPrice = typeof sp.minPrice === "string" && sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = typeof sp.maxPrice === "string" && sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const minRating = typeof sp.minRating === "string" && sp.minRating ? Number(sp.minRating) : undefined;
  const discountedOnly = sp.discountedOnly === "1";
  const page = typeof sp.page === "string" ? Number(sp.page) : 1;

  const [{ items, total, pageCount }, { brands }] = await Promise.all([
    queryListing({ categorySlug: slug, sort: sort as ListingFilters["sort"], brand, minPrice, maxPrice, minRating, discountedOnly, page }),
    getFilterOptions(),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">{category.name}</h1>
          <SortSelect current={sort} />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          <FilterSidebar
            brands={brands}
            basePath={`/categories/${slug}`}
            current={{ brand, minPrice: sp.minPrice as string, maxPrice: sp.maxPrice as string, minRating: sp.minRating as string, discountedOnly: sp.discountedOnly as string, sort }}
          />
          <div className="flex-1">
            <ProductGrid items={items} total={total} page={page} pageCount={pageCount} basePath={`/categories/${slug}`} query={{ sort, brand, minPrice: sp.minPrice as string, maxPrice: sp.maxPrice as string, minRating: sp.minRating as string, discountedOnly: sp.discountedOnly as string }} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
