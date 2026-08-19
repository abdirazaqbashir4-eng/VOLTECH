import { db } from "@voltech/database";
import { availableStock } from "./inventory";
import { getActivePromotionPrice } from "./pricing";

export async function getOrCreateCart(userId: string) {
  const existing = await db.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.cart.create({ data: { userId } });
}

export async function addToCart(userId: string, variantId: string, quantity: number) {
  if (quantity < 1) throw new Error("Quantity must be at least 1");

  const variant = await db.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    include: { product: true, inventory: true },
  });
  if (variant.product.status !== "APPROVED") throw new Error("This product is not available");
  if (variant.status !== "ACTIVE") throw new Error("This option is currently unavailable");

  const cart = await getOrCreateCart(userId);
  const existing = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  const desiredQty = (existing?.quantity ?? 0) + quantity;
  const available = variant.inventory ? availableStock(variant.inventory) : 0;
  if (desiredQty > available) {
    throw new Error(`Only ${available} in stock`);
  }

  if (existing) {
    return db.cartItem.update({ where: { id: existing.id }, data: { quantity: desiredQty, savedForLater: false } });
  }
  return db.cartItem.create({
    data: { cartId: cart.id, productId: variant.productId, variantId, quantity },
  });
}

export async function updateCartItemQuantity(userId: string, cartItemId: string, quantity: number) {
  const item = await db.cartItem.findUniqueOrThrow({
    where: { id: cartItemId },
    include: { cart: true, variant: { include: { inventory: true } } },
  });
  if (item.cart.userId !== userId) throw new Error("Not authorized");

  if (quantity < 1) {
    return db.cartItem.delete({ where: { id: cartItemId } });
  }
  const available = item.variant.inventory ? availableStock(item.variant.inventory) : 0;
  if (quantity > available) throw new Error(`Only ${available} in stock`);

  return db.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
}

export async function removeCartItem(userId: string, cartItemId: string) {
  const item = await db.cartItem.findUniqueOrThrow({ where: { id: cartItemId }, include: { cart: true } });
  if (item.cart.userId !== userId) throw new Error("Not authorized");
  return db.cartItem.delete({ where: { id: cartItemId } });
}

export async function setSavedForLater(userId: string, cartItemId: string, saved: boolean) {
  const item = await db.cartItem.findUniqueOrThrow({ where: { id: cartItemId }, include: { cart: true } });
  if (item.cart.userId !== userId) throw new Error("Not authorized");
  return db.cartItem.update({ where: { id: cartItemId }, data: { savedForLater: saved } });
}

export interface CartSellerGroup {
  sellerId: string;
  sellerName: string;
  storeSlug: string;
  items: {
    cartItemId: string;
    productId: string;
    productName: string;
    productSlug: string;
    variantId: string;
    variantOptions: Record<string, string>;
    imageUrl: string | null;
    unitPrice: number;
    compareAtPrice: number | null;
    quantity: number;
    lineSubtotal: number;
    availableStock: number;
    inStock: boolean;
  }[];
  sellerSubtotal: number;
}

export async function getCartView(userId: string) {
  const cart = await getOrCreateCart(userId);
  const items = await db.cartItem.findMany({
    where: { cartId: cart.id, savedForLater: false },
    include: {
      product: { include: { seller: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
      variant: { include: { inventory: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map<string, CartSellerGroup>();
  for (const item of items) {
    const promo = await getActivePromotionPrice(item.productId, item.variant.price);
    const unitPrice = promo?.price ?? item.variant.price;
    const available = item.variant.inventory ? availableStock(item.variant.inventory) : 0;

    const key = item.product.sellerId;
    if (!groups.has(key)) {
      groups.set(key, {
        sellerId: item.product.sellerId,
        sellerName: item.product.seller.storeName,
        storeSlug: item.product.seller.storeSlug,
        items: [],
        sellerSubtotal: 0,
      });
    }
    const group = groups.get(key)!;
    const lineSubtotal = Math.round(unitPrice * item.quantity * 100) / 100;
    group.items.push({
      cartItemId: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSlug: item.product.slug,
      variantId: item.variantId,
      variantOptions: JSON.parse(item.variant.optionsJson),
      imageUrl: item.product.images[0]?.url ?? null,
      unitPrice,
      compareAtPrice: item.variant.compareAtPrice,
      quantity: item.quantity,
      lineSubtotal,
      availableStock: available,
      inStock: available >= item.quantity,
    });
    group.sellerSubtotal = Math.round((group.sellerSubtotal + lineSubtotal) * 100) / 100;
  }

  const sellerGroups = Array.from(groups.values());
  const subtotal = Math.round(sellerGroups.reduce((s, g) => s + g.sellerSubtotal, 0) * 100) / 100;
  const itemCount = sellerGroups.reduce((s, g) => s + g.items.reduce((n, i) => n + i.quantity, 0), 0);

  return { cart, sellerGroups, subtotal, itemCount };
}

export async function getSavedForLaterItems(userId: string) {
  const cart = await getOrCreateCart(userId);
  return db.cartItem.findMany({
    where: { cartId: cart.id, savedForLater: true },
    include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } }, variant: true },
    orderBy: { updatedAt: "desc" },
  });
}
