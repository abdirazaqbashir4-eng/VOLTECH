import type { ProductCardData } from "@/components/ProductCard";

type ProductWithRelations = {
  slug: string;
  name: string;
  ratingAvg: number;
  ratingCount: number;
  images: { url: string }[];
  variants: { price: number; compareAtPrice: number | null }[];
  seller: { storeName: string };
};

/** A product's "card price" is its cheapest variant — the price shown before the shopper picks options. */
export function toCardData(product: ProductWithRelations): ProductCardData {
  const cheapest = product.variants.reduce((min, v) => (v.price < min.price ? v : min), product.variants[0]);
  return {
    slug: product.slug,
    name: product.name,
    imageUrl: product.images[0]?.url ?? null,
    price: cheapest?.price ?? 0,
    compareAtPrice: cheapest?.compareAtPrice ?? null,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    sellerName: product.seller.storeName,
  };
}
