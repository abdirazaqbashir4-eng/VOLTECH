import { NextRequest, NextResponse } from "next/server";
import { db } from "@voltech/database";
import type { Prisma } from "@voltech/database";

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  const rating = req.nextUrl.searchParams.get("rating");
  const verifiedOnly = req.nextUrl.searchParams.get("verifiedOnly") === "1";
  const withImages = req.nextUrl.searchParams.get("withImages") === "1";
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  const where: Prisma.ReviewWhereInput = { productId, status: "PUBLISHED" };
  if (rating) where.rating = Number(rating);
  if (verifiedOnly) where.verifiedPurchase = true;
  if (withImages) where.imagesJson = { not: "[]" };

  const reviews = await db.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { customer: { select: { fullName: true } } },
  });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      images: JSON.parse(r.imagesJson) as string[],
      verifiedPurchase: r.verifiedPurchase,
      createdAt: r.createdAt,
      customerName: r.customer.fullName,
    })),
  });
}
