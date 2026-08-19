"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { moderateReview } from "@voltech/core/marketplace/reviews";

export async function moderateReviewAction(reviewId: string, status: "PUBLISHED" | "HIDDEN" | "FLAGGED") {
  await requireAdmin();
  await moderateReview(reviewId, status);
  revalidatePath("/reviews");
  return { ok: true as const };
}
