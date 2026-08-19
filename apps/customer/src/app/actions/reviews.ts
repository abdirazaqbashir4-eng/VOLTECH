"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createReview } from "@voltech/core/marketplace/reviews";

export async function submitReviewAction(input: {
  productId: string;
  productSlug: string;
  orderId: string;
  rating: number;
  title?: string;
  body?: string;
}) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Please sign in to leave a review." };

  try {
    await createReview({
      customerId: session.user.id,
      productId: input.productId,
      orderId: input.orderId,
      rating: input.rating,
      title: input.title,
      body: input.body,
    });
    revalidatePath(`/products/${input.productSlug}`);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}
