import { db } from "@voltech/database";
import { round2 } from "../money";
import { returnStock } from "./inventory";
import { recordLedgerEntry } from "./ledger";
import { notify } from "./notifications";

export async function requestReturn(customerId: string, sellerOrderId: string, reason: string, description?: string) {
  const sellerOrder = await db.sellerOrder.findUniqueOrThrow({ where: { id: sellerOrderId }, include: { order: true } });
  if (sellerOrder.order.customerId !== customerId) throw new Error("Not authorized");
  if (sellerOrder.status !== "DELIVERED") throw new Error("Only delivered orders can be returned");

  const seller = await db.sellerProfile.findUniqueOrThrow({ where: { id: sellerOrder.sellerId } });
  const request = await db.returnRequest.create({
    data: { sellerOrderId, reason, description, status: "REQUESTED" },
  });

  await notify(db, {
    userId: seller.userId,
    type: "RETURN_REQUESTED",
    title: "Return requested",
    body: `A return was requested for order ${sellerOrder.sellerOrderNumber}.`,
    linkUrl: `/seller/returns/${request.id}`,
  });

  return request;
}

/** Seller/admin approves a return: stock goes back to sellable inventory and the sale is reversed in the ledger. */
export async function approveReturn(returnRequestId: string) {
  await db.$transaction(async (tx) => {
    const request = await tx.returnRequest.findUniqueOrThrow({
      where: { id: returnRequestId },
      include: { sellerOrder: { include: { items: true, order: true } } },
    });
    if (request.status !== "REQUESTED") throw new Error("Return already resolved");

    const sellerOrder = request.sellerOrder;
    for (const item of sellerOrder.items) {
      await returnStock(tx, item.variantId, sellerOrder.sellerId, item.quantity, sellerOrder.sellerOrderNumber);
    }

    const refundAmount = round2(sellerOrder.itemsSubtotal - sellerOrder.discountTotal);
    await recordLedgerEntry(tx, {
      sellerId: sellerOrder.sellerId,
      sellerOrderId: sellerOrder.id,
      type: "REFUND",
      amount: -refundAmount,
      balanceType: "AVAILABLE",
      description: `Refund for returned order ${sellerOrder.sellerOrderNumber}`,
    });
    await recordLedgerEntry(tx, {
      sellerId: sellerOrder.sellerId,
      sellerOrderId: sellerOrder.id,
      type: "REFUND",
      amount: sellerOrder.commissionAmount,
      balanceType: "AVAILABLE",
      description: `Commission reversed for returned order ${sellerOrder.sellerOrderNumber}`,
    });

    await tx.sellerOrder.update({ where: { id: sellerOrder.id }, data: { status: "RETURNED" } });
    await tx.returnRequest.update({ where: { id: returnRequestId }, data: { status: "REFUNDED", resolvedAt: new Date() } });

    if (sellerOrder.order.customerId) {
      await notify(tx, {
        userId: sellerOrder.order.customerId,
        type: "ORDER_REFUNDED",
        title: "Return approved",
        body: `Your return for order ${sellerOrder.sellerOrderNumber} was approved and refunded.`,
        linkUrl: `/account/orders/${sellerOrder.orderId}`,
      });
    }
  });
}

export async function rejectReturn(returnRequestId: string) {
  await db.returnRequest.update({ where: { id: returnRequestId }, data: { status: "REJECTED", resolvedAt: new Date() } });
}
