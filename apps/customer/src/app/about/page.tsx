import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "About us" };

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="mb-4 text-xl font-bold text-slate-900">About VOLTECH</h1>
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            VOLTECH is a multi-vendor marketplace connecting independent sellers with buyers across Kenya —
            electronics, fashion, home goods and more, all in one place.
          </p>
          <p>
            Every seller on VOLTECH applies through a review process before listing products, and every
            product listing goes through moderation before it goes live. Payments are held and released
            through the platform, with buyer protection and clear order tracking from checkout to delivery.
          </p>
          <p>
            Selling on VOLTECH is open to registered businesses and individual sellers who meet our
            onboarding requirements — see &ldquo;Sell on VOLTECH&rdquo; in the footer to apply.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
