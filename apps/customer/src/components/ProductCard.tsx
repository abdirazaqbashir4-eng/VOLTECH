import Link from "next/link";
import Image from "next/image";
import RatingStars from "./RatingStars";
import PriceDisplay from "./PriceDisplay";
import DiscountBadge from "./DiscountBadge";
import WishlistButton from "./WishlistButton";
import CompareButton from "./CompareButton";
import QuickViewButton from "./QuickViewButton";

export interface ProductCardData {
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  ratingAvg: number;
  ratingCount: number;
  sellerName: string;
  sellerVerified: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isFlashSale: boolean;
  id?: string;
}

export default function ProductCard({ product, isAuthenticated = false }: { product: ProductCardData; isAuthenticated?: boolean }) {
  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--surface)]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
        )}

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {discountPct !== null && <DiscountBadge percent={discountPct} />}
          {product.isFlashSale && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">Flash Sale</span>
          )}
          {product.isBestSeller && (
            <span className="rounded-full bg-brand-ink px-2 py-0.5 text-[11px] font-semibold text-white">Best Seller</span>
          )}
          {product.isNew && !product.isBestSeller && (
            <span className="rounded-full bg-brand-teal px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
          )}
        </div>

        {product.id && (
          <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <WishlistButton productId={product.id} isAuthenticated={isAuthenticated} />
            <CompareButton productId={product.id} />
          </div>
        )}

        <div className="absolute inset-x-2 bottom-2 flex justify-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <QuickViewButton slug={product.slug} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-slate-800">{product.name}</p>
        <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
        {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} size="sm" />}
        <div className="mt-auto flex items-center gap-1 truncate text-xs text-slate-500">
          <span className="truncate">{product.sellerName}</span>
          {product.sellerVerified && (
            <span className="shrink-0 text-brand-teal" title="Verified seller" aria-label="Verified seller">
              ✓
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
