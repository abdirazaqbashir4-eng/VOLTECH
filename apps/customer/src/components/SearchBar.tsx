"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Suggestion {
  label: string;
  href: string;
}

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [products, setProducts] = useState<Suggestion[]>([]);
  const [categories, setCategories] = useState<Suggestion[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setProducts(data.products ?? []);
        setCategories(data.categories ?? []);
        setPopular(data.suggestions ?? []);
      } catch {
        // Suggestions are a convenience, not critical — fail silently.
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  const hasResults = products.length > 0 || categories.length > 0 || popular.length > 0;

  return (
    <div ref={boxRef} className="relative w-full max-w-2xl">
      <form action="/search" method="get" className="flex w-full">
        <input
          type="text"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search products, brands and categories"
          autoComplete="off"
          className="w-full rounded-l-md border-0 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        <button type="submit" className="rounded-r-md bg-brand-teal px-4 text-sm font-medium text-white hover:bg-brand-teal-dark">
          Search
        </button>
      </form>

      {open && hasResults && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-[var(--border)] bg-white py-2 text-sm text-slate-800 shadow-lg">
          {value.length < 2 && popular.length > 0 && (
            <div className="px-3 pb-2">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Popular searches</p>
              {popular.map((p) => (
                <button
                  key={p}
                  className="block w-full rounded px-2 py-1 text-left hover:bg-[var(--surface)]"
                  onClick={() => router.push(`/search?q=${encodeURIComponent(p)}`)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          {categories.length > 0 && (
            <div className="px-3 pb-2">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Categories</p>
              {categories.map((c) => (
                <button
                  key={c.href}
                  className="block w-full rounded px-2 py-1 text-left hover:bg-[var(--surface)]"
                  onClick={() => router.push(c.href)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
          {products.length > 0 && (
            <div className="px-3">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Products</p>
              {products.map((p) => (
                <button
                  key={p.href}
                  className="block w-full rounded px-2 py-1 text-left hover:bg-[var(--surface)]"
                  onClick={() => router.push(p.href)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
