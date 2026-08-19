import type { ProductCardData } from "@/components/ProductCard";

type ProductWithRelations = {
  id: string;
  slug: string;
  name: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  soldCount: number;
  images: { url: string }[];
  variants: { price: number; compareAtPrice: number | null }[];
  seller: { storeName: string; status: string };
};

const NEW_WINDOW_DAYS = 21;
const BEST_SELLER_THRESHOLD = 15; // soldCount — a real, if arbitrary, merchandising cutoff

/** A product's "card price" is its cheapest variant — the price shown before the shopper picks options. */
export function toCardData(product: ProductWithRelations, opts?: { isFlashSale?: boolean }): ProductCardData {
  const cheapest = product.variants.reduce((min, v) => (v.price < min.price ? v : min), product.variants[0]);
  const isNew = Date.now() - product.createdAt.getTime() < NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    imageUrl: product.images[0]?.url ?? null,
    price: cheapest?.price ?? 0,
    compareAtPrice: cheapest?.compareAtPrice ?? null,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    sellerName: product.seller.storeName,
    sellerVerified: product.seller.status === "APPROVED",
    isNew,
    isBestSeller: product.soldCount >= BEST_SELLER_THRESHOLD,
    isFlashSale: opts?.isFlashSale ?? false,
  };
}
