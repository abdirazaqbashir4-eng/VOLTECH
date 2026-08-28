import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { auth } from "@/auth";
import { getCartView } from "@voltech/core/marketplace/cart";
import { availablePaymentProviders } from "@voltech/core/payments";
import TopAppBar from "@/components/TopAppBar";
import CheckoutWizard from "@/components/CheckoutWizard";
import { getShippingMethodsForAddress } from "@/app/actions/checkout";

export const metadata: Metadata = { title: "Checkout" };

const PROVIDER_LABELS: Record<string, string> = {
  MOCK: "Demo payment (sandbox)",
  MPESA: "M-Pesa",
  CARD: "Credit / Debit Card",
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

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const initialShippingMethods = defaultAddress ? await getShippingMethodsForAddress(defaultAddress.id) : [];

  const paymentOptions = availablePaymentProviders().map((p) => ({ provider: p.name, label: PROVIDER_LABELS[p.name] ?? p.name }));

  return (
    <>
      <TopAppBar variant="checkout" />
      <CheckoutWizard
        addresses={addresses}
        initialShippingMethods={initialShippingMethods}
        subtotal={subtotal}
        sellerCount={sellerGroups.length}
        paymentOptions={paymentOptions}
      />
    </>
  );
}
