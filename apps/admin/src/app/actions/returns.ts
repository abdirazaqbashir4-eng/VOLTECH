"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { approveReturn, rejectReturn } from "@voltech/core/marketplace/returns";

export async function adminDecideReturnAction(returnId: string, decision: "APPROVED" | "REJECTED") {
  await requireAdmin();
  try {
    if (decision === "APPROVED") await approveReturn(returnId);
    else await rejectReturn(returnId);
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
  revalidatePath("/returns");
  return { ok: true as const };
}
