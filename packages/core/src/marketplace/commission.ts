import { db } from "@voltech/database";

// Resolution order: seller-specific rule > category rule > global rule.
// Falls back to 10% if the platform has not configured a global rule yet
// (should only happen on a freshly-seeded database before an admin visits
// Commission Settings).
const FALLBACK_GLOBAL_PCT = 10;

export async function resolveCommissionPct(sellerId: string, categoryId: string): Promise<number> {
  const [sellerRule, categoryRule, globalRule] = await Promise.all([
    db.commissionRule.findFirst({ where: { scope: "SELLER", sellerId, active: true } }),
    db.commissionRule.findFirst({ where: { scope: "CATEGORY", categoryId, active: true } }),
    db.commissionRule.findFirst({ where: { scope: "GLOBAL", active: true } }),
  ]);

  if (sellerRule) return sellerRule.percentage;
  if (categoryRule) return categoryRule.percentage;
  if (globalRule) return globalRule.percentage;
  return FALLBACK_GLOBAL_PCT;
}
