"use client";

import { useEffect, useState } from "react";
import { isInCompare, toggleCompare } from "@/lib/compareStore";

export default function CompareButton({ productId, className = "" }: { productId: string; className?: string }) {
  const [active, setActive] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => setActive(isInCompare(productId)), [productId]);

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
