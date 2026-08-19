import Link from "next/link";
import Image from "next/image";
import { formatKES } from "@voltech/core/money";
import RatingStars from "./RatingStars";

export interface ProductCardData {
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  ratingAvg: number;
  ratingCount: number;
  sellerName: string;
}

export default function ProductCard({ product }: { product: ProductCardData }) {
  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
        )}
        {discountPct !== null && (
          <span className="absolute left-2 top-2 rounded bg-brand-amber px-1.5 py-0.5 text-xs font-semibold text-brand-ink">
            -{discountPct}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm text-slate-800">{product.name}</p>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-slate-900">{formatKES(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-slate-400 line-through">{formatKES(product.compareAtPrice)}</span>
          )}
        </div>
        {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} size="sm" />}
        <span className="mt-auto truncate text-xs text-slate-500">{product.sellerName}</span>
      </div>
    </Link>
  );
}
