"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateReviewAction } from "@/app/actions/reviews";

export default function ReviewModerationButtons({ reviewId, status }: { reviewId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function decide(next: "PUBLISHED" | "HIDDEN") {
    startTransition(async () => {
      await moderateReviewAction(reviewId, next);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      {status !== "PUBLISHED" && (
        <button disabled={isPending} onClick={() => decide("PUBLISHED")} className="rounded bg-brand-teal px-3 py-1 text-xs font-medium text-white">
          Publish
        </button>
      )}
      {status !== "HIDDEN" && (
        <button disabled={isPending} onClick={() => decide("HIDDEN")} className="rounded border border-[var(--border)] px-3 py-1 text-xs">
          Hide
        </button>
      )}
    </div>
  );
}
