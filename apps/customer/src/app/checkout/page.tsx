import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { auth } from "@/auth";
import { getCartView } from "@voltech/core/marketplace/cart";
import { availablePaymentProviders } from "@voltech/core/payments";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CheckoutWizard from "@/components/CheckoutWizard";

export const metadata: Metadata = { title: "Checkout" };

const PROVIDER_LABELS: Record<string, string> = {
  MOCK: "Demo payment (sandbox)",
  MPESA: "M-Pesa",
  CARD: "Card payment",
};

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/checkout");

  const [{ sellerGroups, subtotal }, addresses] = await Promise.all([
    getCartView(session.user.id),
    db.address.findMany({ where: { userId: session.user.id }, orderBy: { isDefault: "desc" } }),
  ]);

  if (sellerGroups.length === 0) redirect("/cart");

  const allInStock = sellerGroups.every((g) => g.items.every((i) => i.inStock));
  if (!allInStock) redirect("/cart");

  const paymentOptions = availablePaymentProviders().map((p) => ({ provider: p.name, label: PROVIDER_LABELS[p.name] ?? p.name }));

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl font-bold text-slate-900">Checkout</h1>
        <CheckoutWizard addresses={addresses} subtotal={subtotal} sellerCount={sellerGroups.length} paymentOptions={paymentOptions} />
      </main>
      <Footer />
    </>
  );
}
