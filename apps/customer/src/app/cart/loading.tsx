import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CartLoading() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 h-6 w-32 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="h-40 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-40 animate-pulse rounded-lg bg-slate-200" />
          </div>
          <div className="h-52 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </main>
      <Footer />
    </>
  );
}
