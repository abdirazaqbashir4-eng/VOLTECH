import { db } from "@voltech/database";
import { generatePayoutReference } from "../ids";
import { getSellerBalances, recordLedgerEntry } from "./ledger";
import { notify, notifyAdmins } from "./notifications";

export async function requestPayout(sellerId: string, amount: number) {
  const seller = await db.sellerProfile.findUniqueOrThrow({ where: { id: sellerId } });
  const balances = await getSellerBalances(sellerId);
  if (amount <= 0) throw new Error("Amount must be positive");
  if (amount > balances.availableBalance) throw new Error(`Amount exceeds available balance of ${balances.availableBalance}`);

  const payout = await db.$transaction(async (tx) => {
    const created = await tx.payout.create({
      data: {
        payoutReference: generatePayoutReference(),
        sellerId,
        amount,
        method: seller.payoutMethod,
        destinationDetails: seller.payoutDetails,
        status: "PENDING",
      },
    });
    await recordLedgerEntry(tx, {
      sellerId,
      payoutId: created.id,
      type: "PAYOUT",
      amount: -amount,
      balanceType: "AVAILABLE",
      description: `Payout requested (${created.payoutReference})`,
    });
    await notifyAdmins(tx, {
      type: "PAYOUT_UPDATE",
      title: "Seller payout requested",
      body: `${seller.storeName} requested a payout of ${amount} KES.`,
      linkUrl: `/admin/payouts/${created.id}`,
    });
    return created;
  });

  return payout;
}

export async function processPayout(payoutId: string, adminId: string, decision: "PAID" | "FAILED" | "CANCELLED", failureReason?: string) {
  await db.$transaction(async (tx) => {
    const payout = await tx.payout.findUniqueOrThrow({ where: { id: payoutId }, include: { seller: true } });
    if (payout.status !== "PENDING" && payout.status !== "PROCESSING") throw new Error("Payout already resolved");

    await tx.payout.update({
      where: { id: payoutId },
      data: { status: decision, processedAt: new Date(), processedById: adminId, failureReason },
    });

    // Reverse the reservation if the payout didn't succeed.
    if (decision !== "PAID") {
      await recordLedgerEntry(tx, {
        sellerId: payout.sellerId,
        payoutId: payout.id,
        type: "ADJUSTMENT",
        amount: payout.amount,
        balanceType: "AVAILABLE",
        description: `Reversal: payout ${payout.payoutReference} ${decision.toLowerCase()}`,
      });
    }

    await notify(tx, {
      userId: payout.seller.userId,
      type: "PAYOUT_UPDATE",
      title: `Payout ${decision.toLowerCase()}`,
      body: `Your payout ${payout.payoutReference} of ${payout.amount} KES is ${decision.toLowerCase()}.`,
      linkUrl: `/seller/finance/payouts`,
    });
  });
}
