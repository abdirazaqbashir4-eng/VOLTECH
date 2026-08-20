"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatKES } from "@voltech/core/money";
import { addToCartAction } from "@/app/actions/cart";
import { toggleWishlistAction } from "@/app/actions/wishlist";

export interface VariantOption {
  id: string;
  sku: string;
  options: Record<string, string>;
  price: number;
  compareAtPrice: number | null;
  available: number;
  status: string;
}

export default function ProductPurchasePanel({
  productId,
  variants,
  initiallyWishlisted,
  isAuthenticated,
}: {
  productId: string;
  variants: VariantOption[];
  initiallyWishlisted: boolean;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [wishlisted, setWishlisted] = useState(initiallyWishlisted);
  const [quantity, setQuantity] = useState(1);

  const optionKeys = useMemo(() => {
    const keys = new Set<string>();
    variants.forEach((v) => Object.keys(v.options).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [variants]);

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const key of optionKeys) init[key] = variants[0]?.options[key] ?? "";
    return init;
  });

  const currentVariant = useMemo(
    () => variants.find((v) => optionKeys.every((k) => v.options[k] === selected[k])) ?? variants[0],
    [variants, optionKeys, selected],
  );

  function valuesFor(key: string) {
    return Array.from(new Set(variants.map((v) => v.options[key]).filter(Boolean)));
  }

  function handleAddToCart() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!currentVariant) return;
    setMessage(null);
    startTransition(async () => {
      const result = await addToCartAction(currentVariant.id, quantity);
      if (result.ok) {
        setMessage({ type: "success", text: "Added to cart." });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  function handleBuyNow() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!currentVariant) return;
    setMessage(null);
    startTransition(async () => {
      const result = await addToCartAction(currentVariant.id, quantity);
      if (result.ok) {
        router.push("/checkout");
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  function handleWishlist() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (result.ok) setWishlisted(result.wishlisted);
    });
  }

  if (!currentVariant) return null;

  const outOfStock = currentVariant.available <= 0 || currentVariant.status !== "ACTIVE";

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-2xl font-bold text-slate-900">{formatKES(currentVariant.price)}</span>
        {currentVariant.compareAtPrice && currentVariant.compareAtPrice > currentVariant.price && (
          <span className="text-slate-400 line-through">{formatKES(currentVariant.compareAtPrice)}</span>
        )}
      </div>

      {optionKeys.map((key) => (
        <div key={key}>
          <p className="mb-1.5 text-sm font-medium text-slate-700">{key}</p>
          <div className="flex flex-wrap gap-2">
            {valuesFor(key).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [key]: val }))}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  selected[key] === val ? "border-brand-teal bg-brand-teal/10 text-brand-teal-dark" : "border-[var(--border)] text-slate-700 hover:border-brand-teal"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      ))}

      <p className="text-sm text-slate-500">SKU: {currentVariant.sku}</p>

      {outOfStock ? (
        <p className="font-medium text-red-600">Out of stock</p>
      ) : (
        <p className="text-sm text-green-700">In stock ({currentVariant.available} available)</p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-[var(--border)] transition-colors">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 text-slate-600 hover:bg-[var(--surface)]">
            −
          </button>
          <span className="w-10 text-center text-sm">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(currentVariant.available, q + 1))}
            className="px-3 py-2 text-slate-600 hover:bg-[var(--surface)]"
          >
            +
          </button>
        </div>

        <button
          type="button"
          disabled={outOfStock || isPending}
          onClick={handleAddToCart}
          className="flex-1 rounded-lg border border-brand-teal py-2.5 transition-colors font-semibold text-brand-teal hover:bg-brand-teal/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add to cart"}
        </button>

        <button
          type="button"
          disabled={outOfStock || isPending}
          onClick={handleBuyNow}
          className="flex-1 rounded-lg bg-brand-teal shadow-sm transition-colors py-2.5 font-semibold text-white hover:bg-brand-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buy now
        </button>

        <button
          type="button"
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className={`rounded-lg border px-3 py-2.5 transition-colors ${wishlisted ? "border-brand-amber text-brand-amber-dark" : "border-[var(--border)] text-slate-500"}`}
        >
          {wishlisted ? "♥" : "♡"}
        </button>
      </div>

      {message && <p className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-green-700"}>{message.text}</p>}

      {/* Sticky mobile purchase bar — stays reachable while scrolling through
          description/specs/reviews below. Sits above the app's bottom nav. */}
      <div className="fixed inset-x-0 bottom-14 z-30 flex items-center gap-2 border-t border-[var(--border)] bg-white p-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] md:hidden">
        <span className="min-w-0 flex-1 truncate text-base font-bold text-slate-900">{formatKES(currentVariant.price)}</span>
        <button
          type="button"
          disabled={outOfStock || isPending}
          onClick={handleAddToCart}
          className="rounded-lg border border-brand-teal px-3 py-2 transition-colors text-sm font-semibold text-brand-teal disabled:opacity-50"
        >
          Add to cart
        </button>
        <button
          type="button"
          disabled={outOfStock || isPending}
          onClick={handleBuyNow}
          className="rounded-lg bg-brand-teal shadow-sm transition-colors px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
