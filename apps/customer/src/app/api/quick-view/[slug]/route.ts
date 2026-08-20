import { NextResponse } from "next/server";
import { db } from "@voltech/database";
import { availableStock } from "@voltech/core/marketplace/inventory";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug, status: "APPROVED" },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 4 },
      variants: { where: { status: "ACTIVE" }, include: { inventory: true } },
      seller: { select: { storeName: true, storeSlug: true } },
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: product.id,
    slug: product.slug,
    name: product.name,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    images: product.images.map((i) => i.url),
    sellerName: product.seller.storeName,
    sellerSlug: product.seller.storeSlug,
    shippingInfo: product.shippingInfo,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      options: JSON.parse(v.optionsJson) as Record<string, string>,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      available: v.inventory ? availableStock(v.inventory) : 0,
      status: v.status,
    })),
  });
}
