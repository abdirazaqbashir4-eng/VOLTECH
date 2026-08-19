import Link from "next/link";
import ProductCard from "./ProductCard";
import { toCardData } from "@/lib/catalog";

type Item = Parameters<typeof toCardData>[0];

export default function ProductGrid({
  items,
  total,
  page,
  pageCount,
  basePath,
  query,
}: {
  items: Item[];
  total: number;
  page: number;
  pageCount: number;
  basePath: string;
  query: Record<string, string | undefined>;
}) {
  const pageHref = (p: number) => {
    const params = new URLSearchParams(Object.entries(query).filter(([, v]) => v) as [string, string][]);
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };

  if (items.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-500">No products match these filters.</p>;
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">{total} results</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.slug} product={toCardData(p)} />
        ))}
      </div>
      {pageCount > 1 && (
        <div className="mt-8 flex justify-center gap-2 text-sm">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p)}
              className={`rounded-md px-3 py-1.5 ${p === page ? "bg-brand-teal text-white" : "border border-[var(--border)] text-slate-700 hover:border-brand-teal"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
