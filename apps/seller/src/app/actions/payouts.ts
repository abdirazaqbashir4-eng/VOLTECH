"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/session";
import { requestPayout } from "@voltech/core/marketplace/payouts";

export async function requestPayoutAction(_prevState: unknown, formData: FormData) {
  const { seller } = await requireSeller();
  const amount = Number(formData.get("amount"));

  try {
    await requestPayout(seller.id, amount);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/finance/payouts");
  return { error: null };
}
