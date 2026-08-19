import Link from "next/link";
import Image from "next/image";
import PriceDisplay from "./PriceDisplay";
import DiscountBadge from "./DiscountBadge";

interface FlashProduct {
  slug: string;
  name: string;
  images: { url: string }[];
  variants: {
    price: number;
    compareAtPrice: number | null;
    inventory: { onHand: number; sold: number } | null;
  }[];
}

export default function FlashSaleCard({ product }: { product: FlashProduct }) {
  const cheapest = product.variants.reduce((min, v) => (v.price < min.price ? v : min), product.variants[0]);
  if (!cheapest) return null;

  const discountPct =
    cheapest.compareAtPrice && cheapest.compareAtPrice > cheapest.price
      ? Math.round(((cheapest.compareAtPrice - cheapest.price) / cheapest.compareAtPrice) * 100)
      : null;

  const totalSold = product.variants.reduce((sum, v) => sum + (v.inventory?.sold ?? 0), 0);
  const totalOnHand = product.variants.reduce((sum, v) => sum + (v.inventory?.onHand ?? 0), 0);
  const totalPool = totalSold + totalOnHand;
  const soldPct = totalPool > 0 ? Math.round((totalSold / totalPool) * 100) : null;
  const nearlyGone = soldPct !== null && soldPct >= 80;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-[var(--border)] bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {product.images[0] ? (
          <Image
            src={product.images[0].url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
        )}
        {discountPct !== null && <DiscountBadge percent={discountPct} className="absolute left-2 top-2" />}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-slate-800">{product.name}</p>
        <PriceDisplay price={cheapest.price} compareAtPrice={cheapest.compareAtPrice} size="sm" />
        {soldPct !== null && (
          <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${nearlyGone ? "bg-red-600" : "bg-brand-amber"}`}
                style={{ width: `${Math.max(soldPct, 6)}%` }}
              />
            </div>
            <p className={`mt-1 text-xs ${nearlyGone ? "font-medium text-red-600" : "text-slate-500"}`}>
              {nearlyGone ? "Almost sold out" : `${soldPct}% claimed`}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
