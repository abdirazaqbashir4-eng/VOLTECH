"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { processPayoutAction } from "@/app/actions/payouts";

export default function PayoutDecisionButtons({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function decide(decision: "PAID" | "FAILED") {
    startTransition(async () => {
      await processPayoutAction(payoutId, decision, decision === "FAILED" ? "Marked failed by admin" : undefined);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <button disabled={isPending} onClick={() => decide("PAID")} className="rounded bg-brand-teal px-3 py-1 text-xs font-medium text-white">
        Mark paid
      </button>
      <button disabled={isPending} onClick={() => decide("FAILED")} className="rounded border border-[var(--border)] px-3 py-1 text-xs">
        Mark failed
      </button>
    </div>
  );
}
