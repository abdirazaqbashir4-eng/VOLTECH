import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";

export const metadata: Metadata = { title: "Application submitted" };

export default function ApplicationSubmittedPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16 text-center">
        <p className="text-3xl">📝</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Application submitted</h1>
        <p className="mt-2 text-sm text-slate-600">
          Thanks for applying. Our team reviews every seller application before approving a store — we&apos;ll notify you by email once a decision is made.
        </p>
      </main>
    </>
  );
}
