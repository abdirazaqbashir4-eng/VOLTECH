import { db } from "@voltech/database";
import { round2 } from "../money";
import type { DiscountType } from "../enums";

export function applyDiscount(price: number, type: DiscountType, value: number): number {
  const discounted = type === "PERCENTAGE" ? price - (price * value) / 100 : price - value;
  return round2(Math.max(0, discounted));
}

/**
 * The lowest price among all currently-active promotions attached to this
 * product (platform, category, seller, or flash-sale scoped all use the
 * same Promotion model). Returns null if no promotion currently applies.
 */
export async function getActivePromotionPrice(productId: string, basePrice: number): Promise<{ price: number; promotionId: string } | null> {
  const now = new Date();
  const links = await db.promotionProduct.findMany({
    where: {
      productId,
      promotion: { status: "ACTIVE", startsAt: { lte: now }, endsAt: { gte: now } },
    },
    include: { promotion: true },
  });

  if (links.length === 0) return null;

  let best: { price: number; promotionId: string } | null = null;
  for (const link of links) {
    const price = applyDiscount(basePrice, link.promotion.discountType as DiscountType, link.promotion.discountValue);
    if (!best || price < best.price) best = { price, promotionId: link.promotion.id };
  }
  return best;
}

export async function validateCoupon(code: string, scope: "PLATFORM" | "SELLER", sellerId: string | null, subtotal: number) {
  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.active) return { valid: false as const, reason: "Coupon not found or inactive" };

  const now = new Date();
  if (now < coupon.startsAt || now > coupon.endsAt) return { valid: false as const, reason: "Coupon is not currently valid" };
  if (coupon.scope !== scope) return { valid: false as const, reason: "Coupon not applicable" };
  if (coupon.scope === "SELLER" && coupon.sellerId !== sellerId) return { valid: false as const, reason: "Coupon not applicable to this seller" };
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) return { valid: false as const, reason: "Coupon usage limit reached" };
  if (coupon.minSpend != null && subtotal < coupon.minSpend) return { valid: false as const, reason: `Minimum spend of ${coupon.minSpend} required` };

  let discount = applyDiscount(subtotal, coupon.discountType as DiscountType, coupon.discountValue);
  discount = subtotal - discount;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);

  return { valid: true as const, coupon, discountAmount: round2(discount) };
}
