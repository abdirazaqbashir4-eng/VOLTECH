// Fallback for any route without its own loading.tsx. Kept intentionally
// generic (not shaped like a specific page) since this covers every route —
// category/search/product/cart each have a page-shaped skeleton of their
// own that takes precedence.
export default function RootLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-brand-teal" />
    </div>
  );
}
