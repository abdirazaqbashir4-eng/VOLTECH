"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleWishlistAction } from "@/app/actions/wishlist";

// Card-level quick-action button. Starts from an "unknown" wishlist state
// (listing queries don't join per-user wishlist status — too expensive for
// a grid of 20+ cards) rather than a full-size button on the product page,
// where ProductPurchasePanel already knows the real initial state.
export default function WishlistButton({
  productId,
  isAuthenticated,
  className = "",
}: {
  productId: string;
  isAuthenticated: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [wishlisted, setWishlisted] = useState<boolean | null>(null);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (result.ok) setWishlisted(result.wishlisted);
    });
  }

  const active = wishlisted === true;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm backdrop-blur transition-colors hover:bg-white ${
        active ? "text-red-500" : "text-slate-500"
      } ${className}`}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
