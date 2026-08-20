interface Props {
  brands: { slug: string; name: string }[];
  basePath: string;
  current: {
    q?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    discountedOnly?: string;
    sort?: string;
  };
}

export default function FilterSidebar({ brands, basePath, current }: Props) {
  return (
    <form action={basePath} method="get" className="w-full shrink-0 space-y-6 text-sm lg:w-56">
      {current.q && <input type="hidden" name="q" value={current.q} />}
      {current.sort && <input type="hidden" name="sort" value={current.sort} />}

      <div>
        <h3 className="mb-2 font-semibold text-slate-900">Price range (KES)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="minPrice"
            placeholder="Min"
            defaultValue={current.minPrice}
            className="w-full rounded border border-[var(--border)] px-2 py-1"
          />
          <span>-</span>
          <input
            type="number"
            name="maxPrice"
            placeholder="Max"
            defaultValue={current.maxPrice}
            className="w-full rounded border border-[var(--border)] px-2 py-1"
          />
        </div>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Brand</h3>
          <select name="brand" defaultValue={current.brand ?? ""} className="w-full rounded border border-[var(--border)] px-2 py-1.5">
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <h3 className="mb-2 font-semibold text-slate-900">Minimum rating</h3>
        <select name="minRating" defaultValue={current.minRating ?? ""} className="w-full rounded border border-[var(--border)] px-2 py-1.5">
          <option value="">Any rating</option>
          <option value="4">4★ & up</option>
          <option value="3">3★ & up</option>
          <option value="2">2★ & up</option>
        </select>
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" name="discountedOnly" value="1" defaultChecked={current.discountedOnly === "1"} />
        On discount only
      </label>

      <button type="submit" className="w-full rounded-lg bg-brand-teal shadow-sm transition-colors py-2 font-medium text-white hover:bg-brand-teal-dark">
        Apply filters
      </button>
      <a href={basePath} className="block text-center text-xs text-slate-500 hover:text-brand-teal">
        Clear filters
      </a>
    </form>
  );
}
