import { db } from "@voltech/database";
import { round2 } from "../money";
import { generateOrderNumber, generateSellerOrderNumber, generateTransactionId } from "../ids";
import { resolveCommissionPct } from "./commission";
import { reserveStock, releaseStock, fulfillStock, InsufficientStockError } from "./inventory";
import { recordLedgerEntry, releaseSellerOrderToAvailable } from "./ledger";
import { notify } from "./notifications";
import { getActivePromotionPrice, validateCoupon } from "./pricing";
import { resolveShippingMethods } from "./shipping";
import { getCartView } from "./cart";
import { getPaymentProvider } from "../payments";
import type { PaymentProvider, SellerOrderStatus } from "../enums";
import { SELLER_ORDER_FORWARD_FLOW } from "../enums";

export class CheckoutValidationError extends Error {}

/**
 * Re-derives and validates everything server-side from the live cart/DB
 * state — stock, product/seller status, and pricing — never trusting
 * whatever the client last rendered. This is the one function that turns a
 * cart into a real Order + per-seller SellerOrders + a Payment record.
 */
export async function createOrderFromCart(params: {
  customerId: string;
  addressId: string;
  shippingMethodId?: string;
  paymentProvider: PaymentProvider;
  couponCode?: string;
}) {
  const address = await db.address.findUniqueOrThrow({ where: { id: params.addressId } });
  if (address.userId !== params.customerId) throw new CheckoutValidationError("Address does not belong to this customer");

  const cartView = await getCartView(params.customerId);
  if (cartView.sellerGroups.length === 0) throw new CheckoutValidationError("Your cart is empty");

  for (const group of cartView.sellerGroups) {
    for (const item of group.items) {
      if (!item.inStock) throw new CheckoutValidationError(`"${item.productName}" no longer has enough stock`);
    }
  }

  const shippingMethods = await resolveShippingMethods(address.county);
  if (shippingMethods.length === 0) throw new CheckoutValidationError("Delivery is not available to this address yet");
  const defaultShipping = (params.shippingMethodId && shippingMethods.find((m) => m.id === params.shippingMethodId)) || shippingMethods[0];

  let couponDiscount = 0;
  if (params.couponCode) {
    const result = await validateCoupon(params.couponCode, "PLATFORM", null, cartView.subtotal);
    if (!result.valid) throw new CheckoutValidationError(result.reason);
    couponDiscount = result.discountAmount;
  }

  const orderNumber = generateOrderNumber();
  const transactionId = generateTransactionId();

  const order = await db.$transaction(async (tx) => {
    // Re-validate live product/seller/stock status inside the transaction —
    // the read above is for the payment/shipping precheck; this is the
    // authoritative check right before we commit reservations.
    let itemsSubtotal = 0;
    const perSellerData: {
      sellerId: string;
      items: { productId: string; variantId: string; name: string; options: string; unitPrice: number; quantity: number; lineSubtotal: number; categoryId: string }[];
    }[] = [];

    for (const group of cartView.sellerGroups) {
      const seller = await tx.sellerProfile.findUniqueOrThrow({ where: { id: group.sellerId } });
      if (seller.status !== "APPROVED") throw new CheckoutValidationError(`${seller.storeName} is currently unavailable`);

      const items = [];
      for (const item of group.items) {
        const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
        const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: item.variantId } });
        if (product.status !== "APPROVED") throw new CheckoutValidationError(`"${item.productName}" is no longer available`);
        if (variant.status !== "ACTIVE") throw new CheckoutValidationError(`"${item.productName}" option is no longer available`);

        const promo = await getActivePromotionPrice(item.productId, variant.price);
        const unitPrice = promo?.price ?? variant.price;
        const lineSubtotal = round2(unitPrice * item.quantity);
        itemsSubtotal = round2(itemsSubtotal + lineSubtotal);

        await reserveStock(tx, item.variantId, group.sellerId, item.quantity, orderNumber);

        items.push({
          productId: item.productId,
          variantId: item.variantId,
          name: item.productName,
          options: JSON.stringify(item.variantOptions),
          unitPrice,
          quantity: item.quantity,
          lineSubtotal,
          categoryId: product.categoryId,
        });
      }
      perSellerData.push({ sellerId: group.sellerId, items });
    }

    const shippingTotal = round2(defaultShipping.fee * perSellerData.length);
    const grandTotal = round2(itemsSubtotal - couponDiscount + shippingTotal);

    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        customerId: params.customerId,
        addressId: params.addressId,
        status: "PENDING_PAYMENT",
        itemsSubtotal,
        discountTotal: couponDiscount,
        shippingTotal,
        platformFeeTotal: 0,
        taxTotal: 0,
        grandTotal,
        couponCode: params.couponCode,
        timeline: { create: { status: "PENDING_PAYMENT", note: "Order created, awaiting payment" } },
      },
    });

    for (let i = 0; i < perSellerData.length; i++) {
      const sellerData = perSellerData[i];
      const sellerSubtotal = round2(sellerData.items.reduce((s, it) => s + it.lineSubtotal, 0));
      const sellerDiscountShare = round2((sellerSubtotal / itemsSubtotal) * couponDiscount || 0);

      let commissionAmount = 0;
      for (const item of sellerData.items) {
        const pct = await resolveCommissionPct(sellerData.sellerId, item.categoryId);
        commissionAmount = round2(commissionAmount + round2((item.lineSubtotal * pct) / 100));
      }
      const commissionPct = sellerSubtotal > 0 ? round2((commissionAmount / sellerSubtotal) * 100) : 0;
      const netEarning = round2(sellerSubtotal - sellerDiscountShare - commissionAmount);

      const sellerOrder = await tx.sellerOrder.create({
        data: {
          sellerOrderNumber: generateSellerOrderNumber(orderNumber, i),
          orderId: createdOrder.id,
          sellerId: sellerData.sellerId,
          status: "PENDING_PAYMENT",
          itemsSubtotal: sellerSubtotal,
          discountTotal: sellerDiscountShare,
          shippingFee: defaultShipping.fee,
          commissionAmount,
          commissionPct,
          netEarning,
          shippingMethodId: defaultShipping.id,
          estimatedDeliveryAt: new Date(Date.now() + defaultShipping.estimatedDaysMax * 24 * 60 * 60 * 1000),
        },
      });

      for (const item of sellerData.items) {
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            sellerOrderId: sellerOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.name,
            variantOptionsJson: item.options,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineSubtotal: item.lineSubtotal,
          },
        });
      }
    }

    // Clear purchased items out of the cart now that they're locked into an order.
    const cartItemIds = cartView.sellerGroups.flatMap((g) => g.items.map((i) => i.cartItemId));
    await tx.cartItem.deleteMany({ where: { id: { in: cartItemIds } } });

    await tx.payment.create({
      data: {
        orderId: createdOrder.id,
        provider: params.paymentProvider,
        status: "PENDING",
        amount: grandTotal,
        transactionId,
      },
    });

    return createdOrder;
  });

  return { order, transactionId };
}

/**
 * Initiates payment through the chosen provider and, for providers that
 * settle synchronously (currently only MOCK — real providers confirm via
 * webhook/callback), immediately finalizes the order.
 */
export async function initiateAndMaybeCompletePayment(orderId: string) {
  const payment = await db.payment.findUniqueOrThrow({ where: { orderId } });
  const provider = getPaymentProvider(payment.provider as PaymentProvider);

  let result;
  try {
    result = await provider.initiate({
      transactionId: payment.transactionId,
      amount: payment.amount,
      currency: payment.currency,
      description: `VOLTECH order payment`,
    });
  } catch (err) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", failureReason: (err as Error).message } });
    throw err;
  }

  if (result.status === "PAID") {
    await confirmPayment(orderId, result.providerReference);
  } else if (result.status === "PROCESSING") {
    await db.payment.update({ where: { id: payment.id }, data: { status: "PROCESSING", providerReference: result.providerReference } });
  } else {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", failureReason: result.failureReason } });
  }

  return result;
}

/** Called on successful payment (mock: immediately; real providers: from their webhook handler). */
export async function confirmPayment(orderId: string, providerReference?: string) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { sellerOrders: { include: { items: true } }, payment: true },
    });
    if (order.payment?.status === "PAID") return; // idempotent

    await tx.payment.update({
      where: { orderId },
      data: { status: "PAID", providerReference },
    });
    await tx.paymentTransaction.create({
      data: { paymentId: order.payment!.id, type: "CAPTURE", amount: order.payment!.amount, status: "PAID" },
    });

    await tx.order.update({ where: { id: orderId }, data: { status: "PAID" } });
    await tx.orderEvent.create({ data: { orderId, status: "PAID", note: "Payment received" } });

    for (const sellerOrder of order.sellerOrders) {
      await tx.sellerOrder.update({ where: { id: sellerOrder.id }, data: { status: "PAID" } });

      for (const item of sellerOrder.items) {
        await fulfillStock(tx, item.variantId, sellerOrder.sellerId, item.quantity, order.orderNumber);
        await tx.product.update({ where: { id: item.productId }, data: { soldCount: { increment: item.quantity } } });
      }

      await recordLedgerEntry(tx, {
        sellerId: sellerOrder.sellerId,
        sellerOrderId: sellerOrder.id,
        type: "SALE",
        amount: round2(sellerOrder.itemsSubtotal - sellerOrder.discountTotal),
        balanceType: "PENDING",
        description: `Sale for order ${sellerOrder.sellerOrderNumber}`,
      });
      await recordLedgerEntry(tx, {
        sellerId: sellerOrder.sellerId,
        sellerOrderId: sellerOrder.id,
        type: "COMMISSION",
        amount: -sellerOrder.commissionAmount,
        balanceType: "PENDING",
        description: `Marketplace commission (${sellerOrder.commissionPct}%) for order ${sellerOrder.sellerOrderNumber}`,
      });

      const seller = await tx.sellerProfile.findUniqueOrThrow({ where: { id: sellerOrder.sellerId } });
      await notify(tx, {
        userId: seller.userId,
        type: "NEW_ORDER",
        title: "New order received",
        body: `Order ${sellerOrder.sellerOrderNumber} — ${sellerOrder.items.length} item(s), ${sellerOrder.netEarning} KES net.`,
        linkUrl: `/seller/orders/${sellerOrder.id}`,
      });
    }

    if (order.couponCode) {
      await tx.coupon.updateMany({ where: { code: order.couponCode.toUpperCase() }, data: { usageCount: { increment: 1 } } });
    }

    await notify(tx, {
      userId: order.customerId,
      type: "PAYMENT_CONFIRMED",
      title: "Payment confirmed",
      body: `Your payment for order ${order.orderNumber} was received.`,
      linkUrl: `/account/orders/${order.id}`,
    });
    await notify(tx, {
      userId: order.customerId,
      type: "ORDER_CONFIRMED",
      title: "Order confirmed",
      body: `Order ${order.orderNumber} is being processed.`,
      linkUrl: `/account/orders/${order.id}`,
    });
  });
}

/** Cancel an order before payment (e.g. customer abandons checkout, or payment fails). Releases reserved stock. */
export async function cancelUnpaidOrder(orderId: string, reason: string) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { sellerOrders: { include: { items: true } } } });
    if (order.status !== "PENDING_PAYMENT") throw new Error("Only unpaid orders can be cancelled this way");

    for (const sellerOrder of order.sellerOrders) {
      for (const item of sellerOrder.items) {
        await releaseStock(tx, item.variantId, sellerOrder.sellerId, item.quantity, order.orderNumber);
      }
      await tx.sellerOrder.update({ where: { id: sellerOrder.id }, data: { status: "CANCELLED" } });
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    await tx.orderEvent.create({ data: { orderId, status: "CANCELLED", note: reason } });
    await tx.payment.update({ where: { orderId }, data: { status: "CANCELLED" } }).catch(() => {});
  });
}

const NOTIFICATION_BY_STATUS: Partial<Record<SellerOrderStatus, { type: "ORDER_PROCESSING" | "ORDER_SHIPPED" | "ORDER_OUT_FOR_DELIVERY" | "ORDER_DELIVERED"; title: string }>> = {
  PROCESSING: { type: "ORDER_PROCESSING", title: "Order is being processed" },
  SHIPPED: { type: "ORDER_SHIPPED", title: "Order shipped" },
  OUT_FOR_DELIVERY: { type: "ORDER_OUT_FOR_DELIVERY", title: "Out for delivery" },
  DELIVERED: { type: "ORDER_DELIVERED", title: "Order delivered" },
};

/** Seller (or admin) advances a seller-order through the fulfillment pipeline. */
export async function advanceSellerOrderStatus(sellerOrderId: string, nextStatus: SellerOrderStatus, trackingNumber?: string) {
  await db.$transaction(async (tx) => {
    const sellerOrder = await tx.sellerOrder.findUniqueOrThrow({ where: { id: sellerOrderId }, include: { order: true } });

    const currentIdx = SELLER_ORDER_FORWARD_FLOW.indexOf(sellerOrder.status as SellerOrderStatus);
    const nextIdx = SELLER_ORDER_FORWARD_FLOW.indexOf(nextStatus);
    if (currentIdx === -1 || nextIdx === -1 || nextIdx !== currentIdx + 1) {
      throw new Error(`Cannot move order from ${sellerOrder.status} to ${nextStatus}`);
    }

    await tx.sellerOrder.update({
      where: { id: sellerOrderId },
      data: {
        status: nextStatus,
        trackingNumber: trackingNumber ?? sellerOrder.trackingNumber,
        deliveredAt: nextStatus === "DELIVERED" ? new Date() : undefined,
      },
    });

    if (nextStatus === "DELIVERED") {
      await releaseSellerOrderToAvailable(tx, sellerOrderId);
    }

    // Reflect on the parent order once every seller-order agrees.
    const siblings = await tx.sellerOrder.findMany({ where: { orderId: sellerOrder.orderId } });
    const allDelivered = siblings.every((s) => (s.id === sellerOrderId ? nextStatus : s.status) === "DELIVERED");
    if (allDelivered) {
      await tx.order.update({ where: { id: sellerOrder.orderId }, data: { status: "PROCESSING" } });
    }

    const note = NOTIFICATION_BY_STATUS[nextStatus];
    if (note) {
      await notify(tx, {
        userId: sellerOrder.order.customerId,
        type: note.type,
        title: note.title,
        body: `Order ${sellerOrder.sellerOrderNumber}: ${note.title.toLowerCase()}.`,
        linkUrl: `/account/orders/${sellerOrder.orderId}`,
      });
    }
  });
}

export { InsufficientStockError };
