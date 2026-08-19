"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestReturnAction } from "@/app/actions/orders";

export default function ReturnRequestButton({ sellerOrderId }: { sellerOrderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-brand-teal hover:underline">
        Request return
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded border border-[var(--border)] p-3">
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded border border-[var(--border)] px-2 py-1 text-xs">
        <option value="">Select a reason</option>
        <option value="DEFECTIVE">Item is defective</option>
        <option value="WRONG_ITEM">Wrong item received</option>
        <option value="NOT_AS_DESCRIBED">Not as described</option>
        <option value="CHANGED_MIND">Changed my mind</option>
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={!reason || isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await requestReturnAction(sellerOrderId, reason);
              if (result.ok) {
                setOpen(false);
                router.refresh();
              } else {
                setError(result.error);
              }
            })
          }
          className="rounded bg-brand-teal px-3 py-1 text-xs font-medium text-white"
        >
          Submit
        </button>
        <button onClick={() => setOpen(false)} className="rounded border border-[var(--border)] px-3 py-1 text-xs">
          Cancel
        </button>
      </div>
    </div>
  );
}
