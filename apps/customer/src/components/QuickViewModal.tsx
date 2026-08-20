"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatKES } from "@voltech/core/money";
import { addToCartAction } from "@/app/actions/cart";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import RatingStars from "./RatingStars";

interface QuickViewData {
  id: string;
  slug: string;
  name: string;
  ratingAvg: number;
  ratingCount: number;
  images: string[];
  sellerName: string;
  sellerSlug: string;
  shippingInfo: string | null;
  variants: {
    id: string;
    sku: string;
    options: Record<string, string>;
    price: number;
    compareAtPrice: number | null;
    available: number;
    status: string;
  }[];
}

export default function QuickViewModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<QuickViewData | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/quick-view/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setData(d);
        const optionKeys = new Set<string>();
        d.variants?.forEach((v: QuickViewData["variants"][number]) => Object.keys(v.options).forEach((k) => optionKeys.add(k)));
        const init: Record<string, string> = {};
        optionKeys.forEach((k) => (init[k] = d.variants?.[0]?.options[k] ?? ""));
        setSelected(init);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const optionKeys = useMemo(() => (data ? Array.from(new Set(data.variants.flatMap((v) => Object.keys(v.options)))) : []), [data]);
  const currentVariant = useMemo(
    () => data?.variants.find((v) => optionKeys.every((k) => v.options[k] === selected[k])) ?? data?.variants[0],
    [data, optionKeys, selected],
  );

  function valuesFor(key: string) {
    return Array.from(new Set(data?.variants.map((v) => v.options[key]).filter(Boolean)));
  }

  function handleAddToCart() {
    if (!currentVariant) return;
    startTransition(async () => {
      const result = await addToCartAction(currentVariant.id, quantity);
      if (result.ok) {
        setMessage({ type: "success", text: "Added to cart." });
      } else {
        setMessage({ type: "error", text: result.error });
        if (result.error.includes("sign in")) router.push(`/login?callbackUrl=/products/${slug}`);
      }
    });
  }

  function handleWishlist() {
    startTransition(async () => {
      const result = await toggleWishlistAction(data!.id);
      if (!result.ok) router.push(`/login?callbackUrl=/products/${slug}`);
    });
  }

  const outOfStock = currentVariant ? currentVariant.available <= 0 || currentVariant.status !== "ACTIVE" : true;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-3 top-3 z-10 text-xl text-slate-400 hover:text-slate-700">
          ✕
        </button>

        {!data ? (
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="aspect-square animate-pulse rounded bg-slate-200" />
            <div className="space-y-3">
              <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-1/3 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[var(--surface)]">
              {data.images[0] && <Image src={data.images[0]} alt={data.name} fill sizes="(max-width: 640px) 90vw, 400px" className="object-cover" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{data.name}</h2>
              <div className="mt-1 flex items-center gap-3 text-sm">
                {data.ratingCount > 0 && <RatingStars value={data.ratingAvg} count={data.ratingCount} />}
                <Link href={`/store/${data.sellerSlug}`} className="text-brand-teal hover:underline">{data.sellerName}</Link>
              </div>

              {currentVariant && (
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-display text-xl font-bold text-slate-900">{formatKES(currentVariant.price)}</span>
                  {currentVariant.compareAtPrice && currentVariant.compareAtPrice > currentVariant.price && (
                    <span className="text-slate-400 line-through">{formatKES(currentVariant.compareAtPrice)}</span>
                  )}
                </div>
              )}

              {optionKeys.map((key) => (
                <div key={key} className="mt-3">
                  <p className="mb-1 text-xs font-medium text-slate-600">{key}</p>
                  <div className="flex flex-wrap gap-2">
                    {valuesFor(key).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelected((s) => ({ ...s, [key]: val }))}
                        className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                          selected[key] === val ? "border-brand-teal bg-brand-teal/10 text-brand-teal-dark" : "border-[var(--border)] text-slate-700"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {data.shippingInfo && <p className="mt-3 text-xs text-slate-500">🚚 {data.shippingInfo}</p>}
              <p className="mt-2 text-sm">
                {outOfStock ? <span className="font-medium text-red-600">Out of stock</span> : <span className="text-green-700">In stock ({currentVariant?.available} available)</span>}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-[var(--border)] transition-colors">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-2.5 py-1.5 text-slate-600">−</button>
                  <span className="w-8 text-center text-sm">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => Math.min(currentVariant?.available ?? 1, q + 1))} className="px-2.5 py-1.5 text-slate-600">+</button>
                </div>
                <button
                  type="button"
                  disabled={outOfStock || isPending}
                  onClick={handleAddToCart}
                  className="flex-1 rounded-lg bg-brand-teal shadow-sm transition-colors py-2 text-sm font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-50"
                >
                  Add to cart
                </button>
                <button type="button" onClick={handleWishlist} className="rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-slate-500">♡</button>
              </div>

              {message && <p className={`mt-2 text-xs ${message.type === "error" ? "text-red-600" : "text-green-700"}`}>{message.text}</p>}

              <Link href={`/products/${data.slug}`} onClick={onClose} className="mt-4 block text-sm text-brand-teal hover:underline">
                View full product details →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
