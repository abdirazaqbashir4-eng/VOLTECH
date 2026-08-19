import Link from "next/link";
import RatingStars from "./RatingStars";

export default function SellerCard({
  storeName,
  storeSlug,
  ratingAvg,
  ratingCount,
  productCount,
  verified,
}: {
  storeName: string;
  storeSlug: string;
  ratingAvg: number;
  ratingCount: number;
  productCount: number;
  verified: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Seller</p>
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-base font-semibold text-brand-teal">
          {storeName.charAt(0)}
        </span>
        <div>
          <p className="flex items-center gap-1 font-medium text-slate-900">
            {storeName}
            {verified && (
              <span className="text-brand-teal" title="Verified seller" aria-label="Verified seller">
                ✓
              </span>
            )}
          </p>
          {ratingCount > 0 && <RatingStars value={ratingAvg} count={ratingCount} size="sm" />}
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-500">{productCount} product{productCount === 1 ? "" : "s"}</p>
      <Link
        href={`/store/${storeSlug}`}
        className="mt-3 block rounded-md border border-[var(--border)] py-2 text-center text-sm font-medium text-slate-700 hover:border-brand-teal hover:text-brand-teal"
      >
        View store
      </Link>
    </div>
  );
}
