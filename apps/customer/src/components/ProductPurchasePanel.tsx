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
    <div className="flex flex-col">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <span className="font-headline-lg text-headline-lg text-on-surface">{formatKES(currentVariant.price)}</span>
          {currentVariant.compareAtPrice && currentVariant.compareAtPrice > currentVariant.price && (
            <span className="font-body-sm text-body-sm text-on-surface-variant line-through mb-1">{formatKES(currentVariant.compareAtPrice)}</span>
          )}
        </div>
        <button type="button" onClick={handleWishlist} aria-label="Toggle wishlist" className={`p-1 ${wishlisted ? "text-error" : "text-on-surface-variant"}`}>
          <span className="material-symbols-outlined" style={wishlisted ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            {wishlisted ? "favorite" : "favorite_border"}
          </span>
        </button>
      </div>

      <div className="mt-stack-md flex items-center gap-2">
        <span className={`material-symbols-outlined ${outOfStock ? "text-error" : "text-tertiary-fixed-dim"}`}>
          {outOfStock ? "cancel" : "check_circle"}
        </span>
        <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider">{outOfStock ? "Out of stock" : "In Stock"}</span>
        {!outOfStock && <span className="font-body-sm text-body-sm text-on-surface-variant">({currentVariant.available} available)</span>}
      </div>

      {optionKeys.map((key) => (
        <div key={key} className="mt-stack-md">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-stack-sm">
            {key}: {selected[key]}
          </h3>
          <div className="flex flex-wrap gap-gutter-mobile">
            {valuesFor(key).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [key]: val }))}
                className={`py-2 px-4 rounded font-label-md text-label-md text-center border ${
                  selected[key] === val ? "border-secondary text-secondary bg-secondary-container/10" : "border-outline-variant text-on-surface-variant"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-stack-md flex items-center gap-gutter-mobile">
        <span className="font-body-sm text-body-sm text-on-surface-variant">SKU: {currentVariant.sku}</span>
        <div className="ml-auto flex items-center border border-outline-variant rounded">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-1.5 text-on-surface-variant">
            −
          </button>
          <span className="w-8 text-center font-body-md text-body-md">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(currentVariant.available, q + 1))}
            className="px-3 py-1.5 text-on-surface-variant"
          >
            +
          </button>
        </div>
      </div>

      {message && (
        <p className={`mt-stack-sm font-body-sm text-body-sm ${message.type === "error" ? "text-error" : "text-on-tertiary-container"}`}>{message.text}</p>
      )}

      {/* Sticky Bottom Actions — matches voltech_product_detail_mobile exactly. */}
      <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant p-margin-mobile flex gap-gutter-mobile z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          disabled={outOfStock || isPending}
          onClick={handleAddToCart}
          className="flex-1 h-touch-target-min border border-outline-variant text-secondary font-label-md text-label-md uppercase tracking-wider rounded flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
          {isPending ? "Adding..." : "Add to Cart"}
        </button>
        <button
          type="button"
          disabled={outOfStock || isPending}
          onClick={handleBuyNow}
          className="flex-1 h-touch-target-min bg-secondary text-on-primary font-label-md text-label-md uppercase tracking-wider rounded flex items-center justify-center hover:bg-on-secondary-fixed-variant transition-colors disabled:opacity-50"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
