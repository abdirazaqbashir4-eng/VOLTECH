"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { processPayout } from "@voltech/core/marketplace/payouts";

export async function processPayoutAction(payoutId: string, decision: "PAID" | "FAILED" | "CANCELLED", failureReason?: string) {
  const { session } = await requireAdmin();
  try {
    await processPayout(payoutId, session.user.id, decision, failureReason);
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
  revalidatePath("/payouts");
  return { ok: true as const };
}
