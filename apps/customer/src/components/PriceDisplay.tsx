import { formatKES } from "@voltech/core/money";

export default function PriceDisplay({
  price,
  compareAtPrice,
  size = "md",
}: {
  price: number;
  compareAtPrice: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const hasDiscount = !!compareAtPrice && compareAtPrice > price;
  const priceClass = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  const compareClass = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-bold text-slate-900 ${priceClass}`}>{formatKES(price)}</span>
      {hasDiscount && <span className={`text-slate-400 line-through ${compareClass}`}>{formatKES(compareAtPrice)}</span>}
    </div>
  );
}
