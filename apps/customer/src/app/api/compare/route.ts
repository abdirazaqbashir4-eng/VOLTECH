import { NextRequest, NextResponse } from "next/server";
import { db } from "@voltech/database";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  if (ids.length === 0) return NextResponse.json({ products: [] });

  const products = await db.product.findMany({
    where: { id: { in: ids }, status: "APPROVED" },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      variants: { where: { status: "ACTIVE" }, orderBy: { price: "asc" } },
      brand: true,
      seller: { select: { storeName: true, storeSlug: true, ratingAvg: true } },
    },
  });

  // Preserve the order the client passed (its compare-list order), not DB order.
  const bySlugOrder = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is (typeof products)[number] => !!p);

  return NextResponse.json({
    products: bySlugOrder.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      imageUrl: p.images[0]?.url ?? null,
      price: p.variants[0]?.price ?? p.basePrice,
      compareAtPrice: p.variants[0]?.compareAtPrice ?? p.compareAtPrice,
      brand: p.brand?.name ?? null,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      warrantyInfo: p.warrantyInfo,
      shippingInfo: p.shippingInfo,
      sellerName: p.seller.storeName,
      sellerSlug: p.seller.storeSlug,
      sellerRating: p.seller.ratingAvg,
      specifications: JSON.parse(p.specifications) as Record<string, string>,
    })),
  });
}
