"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminDecideReturnAction } from "@/app/actions/returns";

export default function AdminReturnDecisionButtons({ returnId }: { returnId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function decide(decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await adminDecideReturnAction(returnId, decision);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <button disabled={isPending} onClick={() => decide("APPROVED")} className="rounded bg-brand-teal px-3 py-1 text-xs font-medium text-white">
        Approve &amp; refund
      </button>
      <button disabled={isPending} onClick={() => decide("REJECTED")} className="rounded border border-[var(--border)] px-3 py-1 text-xs">
        Reject
      </button>
    </div>
  );
}
