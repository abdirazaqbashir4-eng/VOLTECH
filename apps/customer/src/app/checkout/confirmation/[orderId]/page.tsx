import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { auth } from "@/auth";
import { formatKES } from "@voltech/core/money";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="rounded-lg border border-[var(--border)] p-6 text-center">
          <p className="text-3xl">✅</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">Order confirmed</h1>
          <p className="mt-1 text-slate-600">Order number: <span className="font-medium">{order.orderNumber}</span></p>
          <p className="text-sm text-slate-500">Payment status: {order.payment?.status ?? "PENDING"}</p>
        </div>

        <div className="mt-6 space-y-4">
          {order.sellerOrders.map((so) => (
            <div key={so.id} className="rounded-lg border border-[var(--border)] p-4">
              <p className="font-medium text-slate-900">{so.seller.storeName}</p>
              <p className="text-xs text-slate-500">Order {so.sellerOrderNumber} — Status: {so.status}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {so.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.productName} × {item.quantity}</span>
                    <span>{formatKES(item.lineSubtotal)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-[var(--border)] p-4 text-sm">
          <div className="flex justify-between"><span>Product subtotal</span><span>{formatKES(order.itemsSubtotal)}</span></div>
          {order.discountTotal > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatKES(order.discountTotal)}</span></div>}
          <div className="flex justify-between"><span>Delivery</span><span>{formatKES(order.shippingTotal)}</span></div>
          <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 font-semibold text-slate-900"><span>Total</span><span>{formatKES(order.grandTotal)}</span></div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Delivering to {order.address.recipientName}, {order.address.street}, {order.address.city}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/account/orders" className="rounded-md border border-[var(--border)] px-5 py-2.5 text-slate-700">
            View my orders
          </Link>
          <Link href="/" className="rounded-md bg-brand-teal px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-dark">
            Continue shopping
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
