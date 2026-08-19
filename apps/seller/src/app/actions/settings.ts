"use server";

import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { requireSeller } from "@/lib/session";

export async function updateStoreSettingsAction(_prevState: unknown, formData: FormData) {
  const { seller } = await requireSeller();

  await db.sellerProfile.update({
    where: { id: seller.id },
    data: {
      storeDescription: String(formData.get("storeDescription") ?? "").trim(),
      logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
      bannerUrl: String(formData.get("bannerUrl") ?? "").trim() || null,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}
