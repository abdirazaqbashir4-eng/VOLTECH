"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceOrderStatusAction } from "@/app/actions/orders";
import { SELLER_ORDER_FORWARD_FLOW } from "@voltech/core/enums";
import type { SellerOrderStatus } from "@voltech/core/enums";

export default function OrderStatusControl({ sellerOrderId, status }: { sellerOrderId: string; status: SellerOrderStatus }) {
  const router = useRouter();
  const [tracking, setTracking] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const idx = SELLER_ORDER_FORWARD_FLOW.indexOf(status);
  const next = idx >= 0 && idx < SELLER_ORDER_FORWARD_FLOW.length - 1 ? SELLER_ORDER_FORWARD_FLOW[idx + 1] : null;

  if (!next) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {next === "SHIPPED" && (
        <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number (optional)" className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
      )}
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await advanceOrderStatusAction(sellerOrderId, next, tracking || undefined);
            if (result.ok) router.refresh();
            else setError(result.error);
          })
        }
        className="rounded-lg bg-brand-teal shadow-sm transition-colors px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-dark disabled:opacity-50"
      >
        Mark as {next.replace(/_/g, " ").toLowerCase()}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
