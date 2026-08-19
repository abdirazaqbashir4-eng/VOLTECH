"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import * as cart from "@voltech/core/marketplace/cart";

export async function addToCartAction(variantId: string, quantity: number) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Please sign in to add items to your cart." };

  try {
    await cart.addToCart(session.user.id, variantId, quantity);
    revalidatePath("/cart");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}

export async function updateCartItemAction(cartItemId: string, quantity: number) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Not authorized" };
  try {
    await cart.updateCartItemQuantity(session.user.id, cartItemId, quantity);
    revalidatePath("/cart");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}

export async function removeCartItemAction(cartItemId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Not authorized" };
  try {
    await cart.removeCartItem(session.user.id, cartItemId);
    revalidatePath("/cart");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}

export async function saveForLaterAction(cartItemId: string, saved: boolean) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Not authorized" };
  try {
    await cart.setSavedForLater(session.user.id, cartItemId, saved);
    revalidatePath("/cart");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}
