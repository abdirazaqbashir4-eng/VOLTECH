import { db } from "@voltech/database";
import { round2 } from "../money";

export async function getEligibleOrdersForReview(customerId: string, productId: string) {
  const items = await db.orderItem.findMany({
    where: {
      productId,
      order: { customerId },
      sellerOrder: { status: "DELIVERED" },
    },
    include: { order: true },
  });
  const reviewed = await db.review.findMany({ where: { productId, customerId }, select: { orderId: true } });
  const reviewedOrderIds = new Set(reviewed.map((r) => r.orderId));
  const seen = new Set<string>();
  return items
    .filter((i) => !reviewedOrderIds.has(i.orderId) && !seen.has(i.orderId) && seen.add(i.orderId))
    .map((i) => i.order);
}

export async function createReview(input: {
  customerId: string;
  productId: string;
  orderId: string;
  rating: number;
  title?: string;
  body?: string;
  images?: string[];
}) {
  if (input.rating < 1 || input.rating > 5) throw new Error("Rating must be between 1 and 5");

  const eligibleOrders = await getEligibleOrdersForReview(input.customerId, input.productId);
  if (!eligibleOrders.some((o) => o.id === input.orderId)) {
    throw new Error("Only verified purchases can be reviewed");
  }

  return db.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        productId: input.productId,
        customerId: input.customerId,
        orderId: input.orderId,
        rating: input.rating,
        title: input.title,
        body: input.body,
        imagesJson: JSON.stringify(input.images ?? []),
        verifiedPurchase: true,
        status: "PUBLISHED",
      },
    });

    const agg = await tx.review.aggregate({
      where: { productId: input.productId, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: true,
    });
    await tx.product.update({
      where: { id: input.productId },
      data: { ratingAvg: round2(agg._avg.rating ?? 0), ratingCount: agg._count },
    });

    return review;
  });
}

export async function moderateReview(reviewId: string, status: "PUBLISHED" | "HIDDEN" | "FLAGGED") {
  const review = await db.review.update({ where: { id: reviewId }, data: { status } });
  const agg = await db.review.aggregate({
    where: { productId: review.productId, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: true,
  });
  await db.product.update({
    where: { id: review.productId },
    data: { ratingAvg: round2(agg._avg.rating ?? 0), ratingCount: agg._count },
  });
  return review;
}
