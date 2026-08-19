export default function DiscountBadge({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded bg-brand-amber px-1.5 py-0.5 text-xs font-semibold text-brand-ink ${className}`}>
      -{percent}%
    </span>
  );
}
