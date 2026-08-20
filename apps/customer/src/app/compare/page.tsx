import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompareTable from "@/components/CompareTable";

export const metadata: Metadata = { title: "Compare products" };

export default function ComparePage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl font-bold text-slate-900">Compare products</h1>
        <CompareTable />
      </main>
      <Footer />
    </>
  );
}
