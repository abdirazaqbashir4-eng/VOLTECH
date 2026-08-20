"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import RatingStars from "./RatingStars";

interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  verifiedPurchase: boolean;
  createdAt: string;
  customerName: string;
}

type Filter = "ALL" | "5" | "4" | "3" | "2" | "1" | "IMAGES" | "VERIFIED";

export default function ReviewsSection({
  productId,
  initialReviews,
  distribution,
  ratingCount,
}: {
  productId: string;
  initialReviews: ReviewItem[];
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  ratingCount: number;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [isPending, startTransition] = useTransition();

  function applyFilter(next: Filter) {
    setFilter(next);
    startTransition(async () => {
      const params = new URLSearchParams({ productId });
      if (["1", "2", "3", "4", "5"].includes(next)) params.set("rating", next);
      if (next === "VERIFIED") params.set("verifiedOnly", "1");
      if (next === "IMAGES") params.set("withImages", "1");
      const res = await fetch(`/api/reviews?${params.toString()}`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
    });
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "5", label: "5★" },
    { key: "4", label: "4★" },
    { key: "3", label: "3★" },
    { key: "2", label: "2★" },
    { key: "1", label: "1★" },
    { key: "IMAGES", label: "With photos" },
    { key: "VERIFIED", label: "Verified purchases" },
  ];

  return (
    <div>
      {ratingCount > 0 && (
        <div className="mb-5 max-w-sm space-y-1">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = distribution[star] ?? 0;
            const pct = ratingCount > 0 ? Math.round((count / ratingCount) * 100) : 0;
            return (
              <button
                key={star}
                onClick={() => applyFilter(filter === String(star) ? "ALL" : (String(star) as Filter))}
                className="flex w-full items-center gap-2 text-xs text-slate-600 hover:text-brand-teal"
              >
                <span className="w-8 shrink-0 text-right">{star}★</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <span className="block h-full bg-brand-amber" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 shrink-0 text-slate-400">{pct}%</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => applyFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              filter === f.key ? "border-brand-teal bg-brand-teal/10 text-brand-teal-dark" : "border-[var(--border)] text-slate-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={`space-y-4 ${isPending ? "opacity-50" : ""}`}>
        {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews match this filter.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-2">
              <RatingStars value={r.rating} />
              <span className="text-sm font-medium text-slate-800">{r.customerName}</span>
              {r.verifiedPurchase && <span className="text-xs text-green-700">Verified purchase</span>}
            </div>
            {r.title && <p className="mt-1 font-medium text-slate-900">{r.title}</p>}
            {r.body && <p className="mt-1 text-sm text-slate-600">{r.body}</p>}
            {r.images.length > 0 && (
              <div className="mt-2 flex gap-2">
                {r.images.map((url) => (
                  <div key={url} className="relative h-16 w-16 overflow-hidden rounded bg-slate-100">
                    <Image src={url} alt="Customer photo" fill sizes="64px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
