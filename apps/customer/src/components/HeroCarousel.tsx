"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SLIDES = [
  {
    id: "shop",
    eyebrow: "VOLTECH MARKETPLACE",
    headline: "Shop thousands of products from trusted local sellers",
    body: "Electronics, fashion, home goods and more — delivered across Kenya.",
    cta: { label: "Start shopping", href: "/categories" },
    from: "from-[var(--brand-ink)]",
    to: "to-slate-700",
  },
  {
    id: "deals",
    eyebrow: "TODAY'S DEALS",
    headline: "Big discounts across every category",
    body: "New markdowns added daily — filter by discount to find them fast.",
    cta: { label: "Shop deals", href: "/search?sort=discount" },
    from: "from-brand-teal-dark",
    to: "to-brand-teal",
  },
  {
    id: "new",
    eyebrow: "JUST LANDED",
    headline: "New arrivals, every week",
    body: "Fresh stock from verified sellers across every category.",
    cta: { label: "See what's new", href: "/search?sort=newest" },
    from: "from-slate-800",
    to: "to-slate-600",
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[index];

  return (
    <div className={`relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-lg bg-gradient-to-br ${slide.from} ${slide.to} p-6 text-white sm:min-h-[300px] sm:p-8`}>
      <p className="text-xs font-semibold tracking-wide text-white/70">{slide.eyebrow}</p>
      <h1 className="mt-2 max-w-md text-2xl font-bold leading-tight sm:text-3xl">{slide.headline}</h1>
      <p className="mt-2 max-w-sm text-sm text-white/80">{slide.body}</p>
      <Link
        href={slide.cta.href}
        className="mt-4 inline-flex w-fit items-center rounded-md bg-brand-amber px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-amber-dark"
      >
        {slide.cta.label}
      </Link>

      <div className="mt-6 flex gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
