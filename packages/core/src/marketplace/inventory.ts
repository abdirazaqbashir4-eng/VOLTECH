import type { Prisma } from "@voltech/database";

// All functions here take a Prisma transaction client (`tx`) — inventory
// mutations must never happen outside a transaction that also writes the
// order/order-item rows that justify them, or stock and orders can drift
// apart under concurrent requests.
type Tx = Prisma.TransactionClient;

export class InsufficientStockError extends Error {
  constructor(public readonly variantId: string, public readonly available: number, public readonly requested: number) {
    super(`Insufficient stock for variant ${variantId}: requested ${requested}, available ${available}`);
    this.name = "InsufficientStockError";
  }
}

/**
 * Reserve stock for a variant at order-creation time. Uses a conditional
 * update (onHand - reserved >= quantity) so concurrent checkouts can never
 * both succeed in overselling the same unit — the second request's update
 * matches zero rows and we throw.
 */
export async function reserveStock(tx: Tx, variantId: string, sellerId: string, quantity: number, reference: string) {
  const inventory = await tx.inventory.findUniqueOrThrow({ where: { variantId } });
  const available = inventory.onHand - inventory.reserved;
  if (available < quantity) {
    throw new InsufficientStockError(variantId, available, quantity);
  }

  const result = await tx.inventory.updateMany({
    where: { variantId, reserved: inventory.reserved }, // optimistic guard
    data: { reserved: { increment: quantity } },
  });
  if (result.count === 0) {
    throw new InsufficientStockError(variantId, available, quantity);
  }

  await tx.inventoryTransaction.create({
    data: {
      inventoryId: inventory.id,
      sellerId,
      type: "RESERVE",
      quantity,
      reference,
      note: `Reserved for order ${reference}`,
    },
  });
}

/** Release a reservation without fulfilling it (payment failed / order cancelled before payment). */
export async function releaseStock(tx: Tx, variantId: string, sellerId: string, quantity: number, reference: string) {
  const inventory = await tx.inventory.findUniqueOrThrow({ where: { variantId } });

  await tx.inventory.update({
    where: { variantId },
    data: { reserved: { decrement: Math.min(quantity, inventory.reserved) } },
  });

  await tx.inventoryTransaction.create({
    data: {
      inventoryId: inventory.id,
      sellerId,
      type: "RELEASE",
      quantity,
      reference,
      note: `Released reservation for order ${reference}`,
    },
  });
}

/** Convert a reservation into a finalized sale after payment succeeds. */
export async function fulfillStock(tx: Tx, variantId: string, sellerId: string, quantity: number, reference: string) {
  const inventory = await tx.inventory.findUniqueOrThrow({ where: { variantId } });

  await tx.inventory.update({
    where: { variantId },
    data: {
      onHand: { decrement: quantity },
      reserved: { decrement: Math.min(quantity, inventory.reserved) },
      sold: { increment: quantity },
    },
  });

  await tx.inventoryTransaction.create({
    data: {
      inventoryId: inventory.id,
      sellerId,
      type: "FULFILL",
      quantity,
      reference,
      note: `Fulfilled order ${reference}`,
    },
  });
}

/** Return stock to sellable inventory (approved return / post-delivery cancellation). */
export async function returnStock(tx: Tx, variantId: string, sellerId: string, quantity: number, reference: string) {
  const inventory = await tx.inventory.findUniqueOrThrow({ where: { variantId } });

  await tx.inventory.update({
    where: { variantId },
    data: {
      onHand: { increment: quantity },
      returned: { increment: quantity },
    },
  });

  await tx.inventoryTransaction.create({
    data: {
      inventoryId: inventory.id,
      sellerId,
      type: "RETURN",
      quantity,
      reference,
      note: `Returned to stock from ${reference}`,
    },
  });
}

/** Seller-initiated restock. */
export async function restock(tx: Tx, variantId: string, sellerId: string, quantity: number, note?: string) {
  const inventory = await tx.inventory.findUniqueOrThrow({ where: { variantId } });

  await tx.inventory.update({
    where: { variantId },
    data: { onHand: { increment: quantity } },
  });

  await tx.inventoryTransaction.create({
    data: {
      inventoryId: inventory.id,
      sellerId,
      type: "RESTOCK",
      quantity,
      note: note ?? "Manual restock",
    },
  });
}

export function availableStock(inventory: { onHand: number; reserved: number }): number {
  return Math.max(0, inventory.onHand - inventory.reserved);
}
