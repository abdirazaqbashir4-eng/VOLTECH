"use server";

import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { auth } from "@/auth";
import { requestReturn } from "@voltech/core/marketplace/returns";

export async function requestReturnAction(sellerOrderId: string, reason: string, description?: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Not authorized" };

  const sellerOrder = await db.sellerOrder.findUnique({ where: { id: sellerOrderId }, include: { order: true } });
  if (!sellerOrder || sellerOrder.order.customerId !== session.user.id) return { ok: false as const, error: "Not authorized" };

  try {
    await requestReturn(session.user.id, sellerOrderId, reason, description);
    revalidatePath(`/account/orders/${sellerOrder.orderId}`);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}
