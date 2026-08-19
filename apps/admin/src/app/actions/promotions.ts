"use server";

import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";

export async function createPlatformPromotionAction(_prevState: unknown, formData: FormData) {
  await requireAdmin();

  const scope = String(formData.get("scope") ?? "PLATFORM") as "PLATFORM" | "CATEGORY" | "FLASH_SALE";
  const categoryId = String(formData.get("categoryId") || "") || undefined;
  const productIds = (formData.getAll("productIds") as string[]).filter(Boolean);

  if ((scope === "PLATFORM" || scope === "FLASH_SALE") && productIds.length === 0) {
    return { error: "Select at least one product." };
  }
  if (scope === "CATEGORY" && !categoryId) return { error: "Select a category." };

  await db.promotion.create({
    data: {
      name: String(formData.get("name")).trim(),
      scope,
      categoryId: scope === "CATEGORY" ? categoryId : undefined,
      discountType: String(formData.get("discountType")) as "PERCENTAGE" | "FIXED",
      discountValue: Number(formData.get("discountValue")),
      startsAt: new Date(String(formData.get("startsAt"))),
      endsAt: new Date(String(formData.get("endsAt"))),
      status: "ACTIVE",
      products: productIds.length > 0 ? { create: productIds.map((productId) => ({ productId })) } : undefined,
    },
  });

  revalidatePath("/promotions");
  return { error: null };
}

export async function cancelPlatformPromotionAction(promotionId: string) {
  await requireAdmin();
  await db.promotion.update({ where: { id: promotionId }, data: { status: "CANCELLED" } });
  revalidatePath("/promotions");
  return { ok: true as const };
}
