export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white">
      <div className="aspect-square w-full animate-pulse bg-[var(--surface-2)]" />
      <div className="flex flex-col gap-2 p-3.5">
        <div className="h-3.5 w-full animate-pulse rounded bg-[var(--surface-2)]" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-[var(--surface-2)]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--surface-2)]" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
