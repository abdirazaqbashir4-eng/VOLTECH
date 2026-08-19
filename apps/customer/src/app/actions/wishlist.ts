"use server";

import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { auth } from "@/auth";

export async function toggleWishlistAction(productId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Please sign in to save favorites." };

  const existing = await db.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/wishlist");
    return { ok: true as const, wishlisted: false };
  }

  await db.wishlistItem.create({ data: { userId: session.user.id, productId } });
  revalidatePath("/wishlist");
  return { ok: true as const, wishlisted: true };
}

export async function moveWishlistItemToCartAction(productId: string, variantId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Not authorized" };
  const { addToCart } = await import("@voltech/core/marketplace/cart");
  try {
    await addToCart(session.user.id, variantId, 1);
    await db.wishlistItem.deleteMany({ where: { userId: session.user.id, productId } });
    revalidatePath("/wishlist");
    revalidatePath("/cart");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}
