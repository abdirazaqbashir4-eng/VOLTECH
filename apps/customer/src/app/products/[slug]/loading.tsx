import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProductLoading() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-4 h-3 w-64 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
          <div className="aspect-square w-full animate-pulse rounded-lg bg-slate-200" />
          <div className="space-y-3">
            <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="h-8 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-56 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </main>
      <Footer />
    </>
  );
}
