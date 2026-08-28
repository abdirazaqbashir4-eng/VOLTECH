import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { auth } from "@/auth";
import { formatKES } from "@voltech/core/money";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function OrderConfirmationPage({ params }: PageProps<"/checkout/confirmation/[orderId]">) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/checkout/confirmation/${orderId}`);

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      sellerOrders: { include: { items: true, seller: true } },
      payment: true,
      address: true,
    },
  });

  if (!order || order.customerId !== session.user.id) notFound();

  const allItems = order.sellerOrders.flatMap((so) => so.items);
  const estDeliveryFrom = new Date(order.createdAt);
  estDeliveryFrom.setDate(estDeliveryFrom.getDate() + 2);
  const estDeliveryTo = new Date(order.createdAt);
  estDeliveryTo.setDate(estDeliveryTo.getDate() + 4);
  const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <main className="flex-1 flex flex-col px-margin-mobile pt-stack-lg pb-stack-lg overflow-y-auto">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center mt-stack-lg mb-stack-lg">
        <div className="w-20 h-20 rounded-full bg-tertiary-fixed/20 flex items-center justify-center mb-stack-md border border-tertiary-fixed">
          <span className="material-symbols-outlined text-4xl text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-stack-xs">Order Placed Successfully!</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px]">
          Your transaction is complete and your order is being prepped for dispatch.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded p-stack-md mb-stack-md">
        <div className="flex justify-between items-center mb-stack-sm pb-stack-sm border-b border-outline-variant">
          <span className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Order Number</span>
          <span className="font-headline-sm text-headline-sm text-on-surface">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Est. Delivery</span>
          <span className="font-headline-sm text-headline-sm text-on-surface">
            {fmtDate(estDeliveryFrom)} - {fmtDate(estDeliveryTo)}
          </span>
        </div>
      </div>

      {/* Order Summary Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded p-stack-md mb-stack-lg flex-1">
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-stack-md border-b border-outline-variant pb-stack-xs">Item Summary</h2>
        {allItems.map((item) => (
          <div key={item.id} className="flex items-start gap-gutter-mobile mb-stack-md">
            <div className="flex-1">
              <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight mb-stack-xs">{item.productName}</h3>
              <div className="flex justify-between items-center mt-stack-xs">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Qty: {item.quantity}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">{formatKES(item.lineSubtotal)}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="pt-stack-md border-t border-outline-variant flex justify-between items-center mt-auto">
          <span className="font-headline-sm text-headline-sm text-on-surface">Total Paid</span>
          <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{formatKES(order.grandTotal)}</span>
        </div>
      </div>

      <p className="text-center font-body-sm text-body-sm text-on-surface-variant mb-stack-lg">
        Delivering to {order.address.recipientName}, {order.address.street}, {order.address.city}
      </p>

      {/* Sticky Bottom Actions */}
      <div className="px-margin-mobile pb-stack-lg bg-background pt-stack-sm border-t border-outline-variant/50 sticky bottom-0 z-10 -mx-margin-mobile">
        <Link
          href="/account/orders"
          className="w-full h-touch-target-min bg-secondary text-on-secondary font-headline-sm text-headline-sm rounded flex items-center justify-center mb-stack-sm active:bg-secondary-container active:text-on-secondary-container transition-colors shadow-sm"
        >
          Track Your Order
        </Link>
        <Link
          href="/"
          className="w-full h-touch-target-min border border-outline-variant text-secondary font-headline-sm text-headline-sm rounded flex items-center justify-center active:bg-surface-container transition-colors bg-surface-container-lowest"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
}
