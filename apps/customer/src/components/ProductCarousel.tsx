"use client";

import { useRef } from "react";
import Link from "next/link";

export default function ProductCarousel({
  title,
  seeAllHref,
  badge,
  children,
}: {
  title: string;
  seeAllHref?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(delta: number) {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <section className="py-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {badge}
        </div>
        <div className="flex items-center gap-2">
          {seeAllHref && (
            <Link href={seeAllHref} className="text-sm font-medium text-brand-teal hover:underline">
              See all
            </Link>
          )}
          <div className="hidden gap-1 sm:flex">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollBy(-600)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-slate-600 hover:border-brand-teal hover:text-brand-teal"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollBy(600)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-slate-600 hover:border-brand-teal hover:text-brand-teal"
            >
              ›
            </button>
          </div>
        </div>
      </div>
      <div ref={trackRef} className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}
