"use server";

import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";
import { decideSellerApplication, setSellerStatus } from "@voltech/core/marketplace/sellers";

export async function decideApplicationAction(applicationId: string, decision: "APPROVED" | "REJECTED", notes?: string) {
  const { session } = await requireAdmin();
  try {
    await decideSellerApplication(applicationId, session.user.id, decision, notes);
    await db.auditLog.create({
      data: { actorId: session.user.id, action: `SELLER_APPLICATION_${decision}`, entityType: "SellerApplication", entityId: applicationId },
    });
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
  revalidatePath("/sellers/applications");
  revalidatePath("/sellers");
  return { ok: true as const };
}

export async function setSellerStatusAction(sellerId: string, status: "APPROVED" | "SUSPENDED") {
  const { session } = await requireAdmin();
  await setSellerStatus(sellerId, status);
  await db.auditLog.create({ data: { actorId: session.user.id, action: `SELLER_${status}`, entityType: "SellerProfile", entityId: sellerId } });
  revalidatePath("/sellers");
  return { ok: true as const };
}
