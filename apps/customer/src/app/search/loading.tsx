import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProductGridSkeleton } from "@/components/Skeleton";

export default function SearchLoading() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-4 h-6 w-56 animate-pulse rounded bg-slate-200" />
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="hidden w-56 shrink-0 space-y-4 lg:block">
            <div className="h-32 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="flex-1">
            <ProductGridSkeleton count={12} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
