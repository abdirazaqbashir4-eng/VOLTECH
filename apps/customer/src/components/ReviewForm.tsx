"use client";

import { useState, useTransition } from "react";
import { submitReviewAction } from "@/app/actions/reviews";

export default function ReviewForm({ productId, productSlug, orders }: { productId: string; productSlug: string; orders: { id: string; orderNumber: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [orderId, setOrderId] = useState(orders[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (orders.length === 0 || done) {
    return done ? <p className="text-sm text-green-700">Thanks — your review has been posted.</p> : null;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await submitReviewAction({ productId, productSlug, orderId, rating, title, body });
          if (result.ok) {
            setDone(true);
          } else {
            setMessage(result.error);
          }
        });
      }}
      className="space-y-3 rounded-lg border border-[var(--border)] p-4"
    >
      <p className="font-medium text-slate-900">Write a review</p>
      {orders.length > 1 && (
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full rounded border border-[var(--border)] px-2 py-1.5 text-sm">
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              Order {o.orderNumber}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} className={n <= rating ? "text-brand-amber" : "text-slate-300"}>
            ★
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full rounded border border-[var(--border)] px-2 py-1.5 text-sm"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your experience with this product"
        rows={3}
        className="w-full rounded border border-[var(--border)] px-2 py-1.5 text-sm"
      />
      {message && <p className="text-sm text-red-600">{message}</p>}
      <button type="submit" disabled={isPending} className="rounded-lg bg-brand-teal shadow-sm transition-colors px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-dark">
        {isPending ? "Posting..." : "Post review"}
      </button>
    </form>
  );
}
