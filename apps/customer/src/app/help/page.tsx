import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "Help center" };

const FAQS = [
  {
    q: "How do I track my order?",
    a: "Go to My account → Order history to see the status and timeline of every order.",
  },
  {
    q: "How do I return an item?",
    a: "Open the order in My account → Order history and use the return option on an eligible item.",
  },
  {
    q: "How do payments work?",
    a: "Payments are processed at checkout and held by VOLTECH until your order is confirmed as delivered.",
  },
  {
    q: "How do I become a seller?",
    a: "Use the “Sell on VOLTECH” link in the footer to apply. Applications are reviewed before approval.",
  },
];

export default function HelpPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-xl font-bold text-slate-900">Help center</h1>
        <div className="space-y-6">
          {FAQS.map((item) => (
            <div key={item.q} className="border-b border-[var(--border)] pb-4">
              <h2 className="mb-1 font-semibold text-slate-900">{item.q}</h2>
              <p className="text-sm text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-500">
          Still need help with an order? Visit{" "}
          <Link href="/account/orders" className="text-brand-teal hover:underline">
            your order history
          </Link>{" "}
          for order-specific support.
        </p>
      </main>
      <Footer />
    </>
  );
}
