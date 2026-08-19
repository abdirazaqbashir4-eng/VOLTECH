"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideProductAction, suspendProductAction } from "@/app/actions/products";

export default function ProductDecisionForm({ productId, status }: { productId: string; status: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (status === "PENDING_APPROVAL") {
    return (
      <div className="space-y-3 rounded-lg border border-[var(--border)] bg-white p-4">
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection reason (if rejecting)" rows={2} className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <button
            disabled={isPending}
            onClick={() => startTransition(async () => { await decideProductAction(productId, "APPROVED"); router.refresh(); })}
            className="rounded-md bg-brand-teal px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-dark"
          >
            Approve
          </button>
          <button
            disabled={isPending}
            onClick={() => startTransition(async () => { await decideProductAction(productId, "REJECTED", reason || undefined); router.refresh(); })}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <button
        disabled={isPending}
        onClick={() => startTransition(async () => { await suspendProductAction(productId); router.refresh(); })}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Suspend listing
      </button>
    );
  }

  return null;
}
