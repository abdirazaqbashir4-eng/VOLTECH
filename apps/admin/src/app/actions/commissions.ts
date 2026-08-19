"use server";

import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";

export async function createCommissionRuleAction(_prevState: unknown, formData: FormData) {
  const { session } = await requireAdmin();
  const scope = String(formData.get("scope")) as "GLOBAL" | "CATEGORY" | "SELLER";
  const percentage = Number(formData.get("percentage"));
  const categoryId = String(formData.get("categoryId") || "") || undefined;
  const sellerId = String(formData.get("sellerId") || "") || undefined;

  if (percentage < 0 || percentage > 100) return { error: "Percentage must be between 0 and 100." };
  if (scope === "CATEGORY" && !categoryId) return { error: "Select a category." };
  if (scope === "SELLER" && !sellerId) return { error: "Select a seller." };

  // Deactivate any existing active rule with the same scope target before creating a new one.
  await db.commissionRule.updateMany({
    where: { scope, categoryId: scope === "CATEGORY" ? categoryId : null, sellerId: scope === "SELLER" ? sellerId : null, active: true },
    data: { active: false },
  });

  await db.commissionRule.create({
    data: { scope, percentage, categoryId: scope === "CATEGORY" ? categoryId : undefined, sellerId: scope === "SELLER" ? sellerId : undefined, active: true },
  });

  await db.auditLog.create({ data: { actorId: session.user.id, action: "COMMISSION_UPDATED", entityType: "CommissionRule", entityId: scope, metadataJson: JSON.stringify({ percentage, categoryId, sellerId }) } });

  revalidatePath("/commissions");
  return { error: null };
}

export async function deactivateCommissionRuleAction(ruleId: string) {
  await requireAdmin();
  await db.commissionRule.update({ where: { id: ruleId }, data: { active: false } });
  revalidatePath("/commissions");
  return { ok: true as const };
}
