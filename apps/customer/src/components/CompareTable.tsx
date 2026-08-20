"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import RatingStars from "./RatingStars";
import EmptyState from "./EmptyState";
import PriceDisplay from "./PriceDisplay";
import { getCompareIds, removeFromCompare, onCompareChange } from "@/lib/compareStore";

interface CompareProduct {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  brand: string | null;
  ratingAvg: number;
  ratingCount: number;
  warrantyInfo: string | null;
  shippingInfo: string | null;
  sellerName: string;
  sellerSlug: string;
  sellerRating: number;
  specifications: Record<string, string>;
}

export default function CompareTable() {
  const [products, setProducts] = useState<CompareProduct[] | null>(null);

  async function load() {
    const ids = getCompareIds();
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    const res = await fetch(`/api/compare?ids=${ids.join(",")}`);
    const data = await res.json();
    setProducts(data.products);
  }

  useEffect(() => {
    const handle = setTimeout(load, 0);
    const unsubscribe = onCompareChange(load);
    return () => {
      clearTimeout(handle);
      unsubscribe();
    };
  }, []);

  const specKeys = Array.from(new Set((products ?? []).flatMap((p) => Object.keys(p.specifications))));

  if (products === null) return <p className="text-sm text-slate-500">Loading...</p>;

  if (products.length === 0) {
    return (
      <EmptyState
        icon="⇄"
        title="Nothing to compare yet"
        description="Tap the compare icon on product cards to add items here (up to 4)."
        actionHref="/"
        actionLabel="Browse products"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <tbody>
          <tr>
            <td className="w-32 shrink-0 border-b border-[var(--border)] pb-4 align-bottom text-xs font-semibold uppercase text-slate-400">Product</td>
            {products.map((p) => (
              <td key={p.id} className="min-w-[180px] border-b border-[var(--border)] px-4 pb-4 align-top">
                <button onClick={() => removeFromCompare(p.id)} className="mb-2 text-xs text-slate-400 hover:text-red-600">
                  Remove ✕
                </button>
                <Link href={`/products/${p.slug}`} className="block">
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--surface)]">
                    {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill sizes="200px" className="object-cover" />}
                  </div>
                  <p className="mt-2 line-clamp-2 font-medium text-slate-900">{p.name}</p>
                </Link>
              </td>
            ))}
          </tr>
          <tr>
            <td className="border-b border-[var(--border)] py-3 text-xs font-semibold uppercase text-slate-400">Price</td>
            {products.map((p) => (
              <td key={p.id} className="border-b border-[var(--border)] px-4 py-3">
                <PriceDisplay price={p.price} compareAtPrice={p.compareAtPrice} size="sm" />
              </td>
            ))}
          </tr>
          <tr>
            <td className="border-b border-[var(--border)] py-3 text-xs font-semibold uppercase text-slate-400">Brand</td>
            {products.map((p) => (
              <td key={p.id} className="border-b border-[var(--border)] px-4 py-3 text-slate-700">{p.brand ?? "—"}</td>
            ))}
          </tr>
          <tr>
            <td className="border-b border-[var(--border)] py-3 text-xs font-semibold uppercase text-slate-400">Rating</td>
            {products.map((p) => (
              <td key={p.id} className="border-b border-[var(--border)] px-4 py-3">
                {p.ratingCount > 0 ? <RatingStars value={p.ratingAvg} count={p.ratingCount} size="sm" /> : <span className="text-slate-400">No reviews</span>}
              </td>
            ))}
          </tr>
          <tr>
            <td className="border-b border-[var(--border)] py-3 text-xs font-semibold uppercase text-slate-400">Seller</td>
            {products.map((p) => (
              <td key={p.id} className="border-b border-[var(--border)] px-4 py-3">
                <Link href={`/store/${p.sellerSlug}`} className="text-brand-teal hover:underline">{p.sellerName}</Link>
              </td>
            ))}
          </tr>
          {specKeys.map((key) => (
            <tr key={key}>
              <td className="border-b border-[var(--border)] py-3 text-xs font-semibold uppercase text-slate-400">{key}</td>
              {products.map((p) => (
                <td key={p.id} className="border-b border-[var(--border)] px-4 py-3 text-slate-700">{p.specifications[key] ?? "—"}</td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="border-b border-[var(--border)] py-3 text-xs font-semibold uppercase text-slate-400">Warranty</td>
            {products.map((p) => (
              <td key={p.id} className="border-b border-[var(--border)] px-4 py-3 text-slate-700">{p.warrantyInfo ?? "—"}</td>
            ))}
          </tr>
          <tr>
            <td className="py-3 text-xs font-semibold uppercase text-slate-400">Delivery</td>
            {products.map((p) => (
              <td key={p.id} className="px-4 py-3 text-slate-700">{p.shippingInfo ?? "Calculated at checkout"}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
