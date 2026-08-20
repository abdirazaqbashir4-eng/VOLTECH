export default function DiscountBadge({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-brand-amber px-2 py-0.5 text-[11px] font-semibold text-brand-ink ${className}`}>
      -{percent}%
    </span>
  );
}
