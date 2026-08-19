"use server";

import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { requireSeller } from "@/lib/session";

export async function createPromotionAction(_prevState: unknown, formData: FormData) {
  const { seller } = await requireSeller();

  const productIds = formData.getAll("productIds") as string[];
  if (productIds.length === 0) return { error: "Select at least one product." };

  const owned = await db.product.count({ where: { id: { in: productIds }, sellerId: seller.id } });
  if (owned !== productIds.length) return { error: "One or more products are not yours." };

  await db.promotion.create({
    data: {
      name: String(formData.get("name")).trim(),
      scope: "SELLER",
      sellerId: seller.id,
      discountType: String(formData.get("discountType")) as "PERCENTAGE" | "FIXED",
      discountValue: Number(formData.get("discountValue")),
      startsAt: new Date(String(formData.get("startsAt"))),
      endsAt: new Date(String(formData.get("endsAt"))),
      status: "ACTIVE",
      products: { create: productIds.map((productId) => ({ productId })) },
    },
  });

  revalidatePath("/promotions");
  return { error: null };
}

export async function cancelPromotionAction(promotionId: string) {
  const { seller } = await requireSeller();
  const promo = await db.promotion.findUnique({ where: { id: promotionId } });
  if (!promo || promo.sellerId !== seller.id) return { ok: false as const, error: "Not authorized" };
  await db.promotion.update({ where: { id: promotionId }, data: { status: "CANCELLED" } });
  revalidatePath("/promotions");
  return { ok: true as const };
}
