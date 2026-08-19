import type { Prisma } from "@voltech/database";
import { db } from "@voltech/database";
import { round2 } from "../money";
import type { LedgerEntryType, LedgerBalanceType } from "../enums";

type Tx = Prisma.TransactionClient;

export async function recordLedgerEntry(
  tx: Tx,
  params: {
    sellerId: string;
    sellerOrderId?: string;
    payoutId?: string;
    type: LedgerEntryType;
    amount: number;
    balanceType: LedgerBalanceType;
    description: string;
  },
) {
  return tx.ledgerEntry.create({
    data: {
      sellerId: params.sellerId,
      sellerOrderId: params.sellerOrderId,
      payoutId: params.payoutId,
      type: params.type,
      amount: params.amount,
      balanceType: params.balanceType,
      description: params.description,
    },
  });
}

/**
 * Move a seller order's net earnings from the PENDING bucket to AVAILABLE
 * once it's safe to pay out (we do this on delivery confirmation). Balances
 * are never edited directly — we always insert an offsetting pair so the
 * ledger stays append-only and fully auditable.
 */
export async function releaseSellerOrderToAvailable(tx: Tx, sellerOrderId: string) {
  const entries = await tx.ledgerEntry.findMany({
    where: { sellerOrderId, balanceType: "PENDING" },
  });
  const pendingNet = round2(entries.reduce((sum, e) => sum + e.amount, 0));
  if (pendingNet === 0) return;

  const sellerOrder = await tx.sellerOrder.findUniqueOrThrow({ where: { id: sellerOrderId } });

  await recordLedgerEntry(tx, {
    sellerId: sellerOrder.sellerId,
    sellerOrderId,
    type: "ADJUSTMENT",
    amount: -pendingNet,
    balanceType: "PENDING",
    description: `Cleared pending balance for order ${sellerOrder.sellerOrderNumber}`,
  });
  await recordLedgerEntry(tx, {
    sellerId: sellerOrder.sellerId,
    sellerOrderId,
    type: "ADJUSTMENT",
    amount: pendingNet,
    balanceType: "AVAILABLE",
    description: `Released to available balance for order ${sellerOrder.sellerOrderNumber}`,
  });
}

export interface SellerBalances {
  grossSales: number;
  commission: number;
  refunds: number;
  netEarnings: number;
  pendingBalance: number;
  availableBalance: number;
  paidOut: number;
}

/** Balances are always derived by summing the ledger — never read from a cached column. */
export async function getSellerBalances(sellerId: string): Promise<SellerBalances> {
  const entries = await db.ledgerEntry.findMany({ where: { sellerId } });

  const sum = (pred: (e: (typeof entries)[number]) => boolean) => round2(entries.filter(pred).reduce((s, e) => s + e.amount, 0));

  const grossSales = sum((e) => e.type === "SALE");
  const commission = sum((e) => e.type === "COMMISSION");
  const refunds = sum((e) => e.type === "REFUND");
  const paidOut = sum((e) => e.type === "PAYOUT");
  const pendingBalance = sum((e) => e.balanceType === "PENDING");
  const availableBalance = sum((e) => e.balanceType === "AVAILABLE");

  return {
    grossSales,
    commission,
    refunds,
    netEarnings: round2(grossSales + commission + refunds),
    pendingBalance,
    availableBalance,
    paidOut,
  };
}
