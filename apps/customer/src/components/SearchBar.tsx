"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface LinkSuggestion {
  label: string;
  href: string;
}
interface ProductSuggestion extends LinkSuggestion {
  imageUrl: string | null;
  price: string | null;
}

const LOCAL_RECENT_KEY = "voltech-recent-searches";

function readLocalRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function pushLocalRecent(query: string) {
  const current = readLocalRecent().filter((q) => q !== query);
  const next = [query, ...current].slice(0, 5);
  window.localStorage.setItem(LOCAL_RECENT_KEY, JSON.stringify(next));
}

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [products, setProducts] = useState<ProductSuggestion[]>([]);
  const [categories, setCategories] = useState<LinkSuggestion[]>([]);
  const [brands, setBrands] = useState<LinkSuggestion[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>(() => readLocalRecent());
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setProducts(data.products ?? []);
        setCategories(data.categories ?? []);
        setBrands(data.brands ?? []);
        setTrending(data.trending ?? []);
        if (data.recent?.length) setRecent(data.recent);
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

  function go(query: string) {
    pushLocalRecent(query);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  function clearHistory() {
    window.localStorage.removeItem(LOCAL_RECENT_KEY);
    setRecent([]);
    fetch("/api/search-suggestions", { method: "DELETE" }).catch(() => {});
  }

  const hasTypedResults = products.length > 0 || categories.length > 0 || brands.length > 0;
  const showIdle = value.length < 2 && (recent.length > 0 || trending.length > 0);

  return (
    <div ref={boxRef} className="relative w-full max-w-2xl">
      <form
        action="/search"
        method="get"
        className="flex w-full"
        onSubmit={() => {
          if (value.trim()) pushLocalRecent(value.trim());
        }}
      >
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

      {open && (showIdle || hasTypedResults) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-md border border-[var(--border)] bg-white py-2 text-sm text-slate-800 shadow-lg">
          {value.length < 2 ? (
            <>
              {recent.length > 0 && (
                <div className="px-3 pb-2">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase text-slate-400">Recent searches</p>
                    <button type="button" onClick={clearHistory} className="text-xs text-brand-teal hover:underline">
                      Clear
                    </button>
                  </div>
                  {recent.map((r) => (
                    <button key={r} className="block w-full rounded px-2 py-1 text-left hover:bg-[var(--surface)]" onClick={() => go(r)}>
                      🕘 {r}
                    </button>
                  ))}
                </div>
              )}
              {trending.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Trending searches</p>
                  {trending.map((t) => (
                    <button key={t} className="block w-full rounded px-2 py-1 text-left hover:bg-[var(--surface)]" onClick={() => go(t)}>
                      🔥 {t}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {categories.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Categories</p>
                  {categories.map((c) => (
                    <button key={c.href} className="block w-full rounded px-2 py-1 text-left hover:bg-[var(--surface)]" onClick={() => { setOpen(false); router.push(c.href); }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              {brands.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Brands</p>
                  {brands.map((b) => (
                    <button key={b.href} className="block w-full rounded px-2 py-1 text-left hover:bg-[var(--surface)]" onClick={() => { setOpen(false); router.push(b.href); }}>
                      {b.label}
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
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-[var(--surface)]"
                      onClick={() => { setOpen(false); router.push(p.href); }}
                    >
                      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-slate-100">
                        {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="32px" className="object-cover" />}
                      </span>
                      <span className="flex-1 truncate">{p.label}</span>
                      {p.price && <span className="shrink-0 text-xs font-medium text-slate-600">{p.price}</span>}
                    </button>
                  ))}
                </div>
              )}
              {!hasTypedResults && <p className="px-3 py-2 text-slate-500">No matches — press Enter to search anyway.</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
