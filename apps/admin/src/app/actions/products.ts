"use server";

import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";
import { decideProductApproval } from "@voltech/core/marketplace/products";

export async function decideProductAction(productId: string, decision: "APPROVED" | "REJECTED", reason?: string) {
  const { session } = await requireAdmin();
  await decideProductApproval(productId, decision, reason);
  await db.auditLog.create({ data: { actorId: session.user.id, action: `PRODUCT_${decision}`, entityType: "Product", entityId: productId } });
  revalidatePath("/products");
  return { ok: true as const };
}

export async function suspendProductAction(productId: string) {
  const { session } = await requireAdmin();
  await db.product.update({ where: { id: productId }, data: { status: "SUSPENDED" } });
  await db.auditLog.create({ data: { actorId: session.user.id, action: "PRODUCT_SUSPENDED", entityType: "Product", entityId: productId } });
  revalidatePath("/products");
  return { ok: true as const };
}
