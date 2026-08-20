import Link from "next/link";

export default function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-[var(--border)] px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <p className="mt-4 font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="mt-5 rounded-lg bg-brand-teal shadow-sm transition-colors px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-teal-dark">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
