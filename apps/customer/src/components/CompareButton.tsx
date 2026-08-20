"use client";

import { useEffect, useState } from "react";
import { isInCompare, toggleCompare, onCompareChange } from "@/lib/compareStore";

export default function CompareButton({ productId, className = "" }: { productId: string; className?: string }) {
  // Starts false (matching SSR, where localStorage isn't available) rather
  // than a lazy initializer reading it — avoids a hydration mismatch when
  // the product is already in the compare list. Synced client-side below.
  const [active, setActive] = useState(false);
  const [full, setFull] = useState(false);

  // Subscribes to the compare list so this button also reflects changes
  // made elsewhere (the /compare page, another card for the same product).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(isInCompare(productId));
    return onCompareChange(() => setActive(isInCompare(productId)));
  }, [productId]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const ok = toggleCompare(productId);
    if (!ok) {
      setFull(true);
      setTimeout(() => setFull(false), 2000);
      return;
    }
    setActive(isInCompare(productId));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      title={full ? "Compare list is full (max 4)" : active ? "Remove from compare" : "Add to compare"}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm backdrop-blur transition-colors hover:bg-white ${
        active ? "text-brand-teal" : "text-slate-500"
      } ${className}`}
    >
      <span aria-hidden>⇄</span>
    </button>
  );
}
