"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { auth } from "@/auth";
import { resolveShippingMethods } from "@voltech/core/marketplace/shipping";
import { createOrderFromCart, initiateAndMaybeCompletePayment, cancelUnpaidOrder, CheckoutValidationError } from "@voltech/core/marketplace/orders";
import type { PaymentProvider } from "@voltech/core/enums";

export async function addAddressAction(input: {
  label: string;
  recipientName: string;
  phone: string;
  county: string;
  city: string;
  street: string;
  building?: string;
  landmark?: string;
  isDefault?: boolean;
}) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Not authorized" };

  if (input.isDefault) {
    await db.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
  }

  const address = await db.address.create({
    data: { ...input, userId: session.user.id },
  });
  revalidatePath("/checkout");
  revalidatePath("/account/addresses");
  return { ok: true as const, address };
}

export async function getShippingMethodsForAddress(addressId: string) {
  const address = await db.address.findUnique({ where: { id: addressId } });
  if (!address) return [];
  return resolveShippingMethods(address.county);
}

/** Same lookup as above, but by a plain county name — used on product pages for a "deliver to" estimate before the shopper has picked/entered an address. */
export async function getShippingMethodsForCounty(county: string) {
  return resolveShippingMethods(county);
}

export async function placeOrderAction(input: {
  addressId: string;
  shippingMethodId: string;
  paymentProvider: PaymentProvider;
  couponCode?: string;
}) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Not authorized" };

  let orderId: string;
  try {
    const { order } = await createOrderFromCart({
      customerId: session.user.id,
      addressId: input.addressId,
      shippingMethodId: input.shippingMethodId,
      paymentProvider: input.paymentProvider,
      couponCode: input.couponCode || undefined,
    });
    orderId = order.id;
  } catch (err) {
    if (err instanceof CheckoutValidationError) return { ok: false as const, error: err.message };
    return { ok: false as const, error: "Could not place your order. Please try again." };
  }

  try {
    const result = await initiateAndMaybeCompletePayment(orderId);
    if (result.status === "FAILED") {
      await cancelUnpaidOrder(orderId, result.failureReason ?? "Payment failed");
      return { ok: false as const, error: result.failureReason ?? "Payment failed. Please try again." };
    }
  } catch (err) {
    await cancelUnpaidOrder(orderId, (err as Error).message);
    return { ok: false as const, error: (err as Error).message };
  }

  revalidatePath("/cart");
  redirect(`/checkout/confirmation/${orderId}`);
}
