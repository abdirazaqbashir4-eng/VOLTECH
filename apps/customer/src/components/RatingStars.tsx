export default function RatingStars({ value, count, size = "md" }: { value: number; count?: number; size?: "sm" | "md" }) {
  const rounded = Math.round(value * 2) / 2;
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={`flex items-center gap-1 ${textSize} text-slate-500`}>
      <span className="text-brand-amber" aria-hidden>
        {"★".repeat(Math.round(rounded))}
        {"☆".repeat(5 - Math.round(rounded))}
      </span>
      {count !== undefined && <span>({count})</span>}
    </div>
  );
}
