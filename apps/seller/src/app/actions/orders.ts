"use server";

import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { requireSeller } from "@/lib/session";
import { advanceSellerOrderStatus } from "@voltech/core/marketplace/orders";
import { approveReturn, rejectReturn } from "@voltech/core/marketplace/returns";
import type { SellerOrderStatus } from "@voltech/core/enums";

export async function advanceOrderStatusAction(sellerOrderId: string, nextStatus: SellerOrderStatus, trackingNumber?: string) {
  const { seller } = await requireSeller();
  const so = await db.sellerOrder.findUnique({ where: { id: sellerOrderId } });
  if (!so || so.sellerId !== seller.id) return { ok: false as const, error: "Not authorized" };

  try {
    await advanceSellerOrderStatus(sellerOrderId, nextStatus, trackingNumber);
    revalidatePath(`/orders/${sellerOrderId}`);
    revalidatePath("/orders");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}

export async function decideReturnAction(returnId: string, decision: "APPROVED" | "REJECTED") {
  const { seller } = await requireSeller();
  const ret = await db.returnRequest.findUnique({ where: { id: returnId }, include: { sellerOrder: true } });
  if (!ret || ret.sellerOrder.sellerId !== seller.id) return { ok: false as const, error: "Not authorized" };

  try {
    if (decision === "APPROVED") await approveReturn(returnId);
    else await rejectReturn(returnId);
    revalidatePath("/returns");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}
