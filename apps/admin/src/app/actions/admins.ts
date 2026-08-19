"use server";

import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { hashPassword } from "@voltech/core/password";
import { requireAdmin } from "@/lib/session";

export async function createAdminAction(_prevState: unknown, formData: FormData) {
  const { session } = await requireAdmin();
  if (session.user.role !== "SUPER_ADMIN") return { error: "Only a super admin can create administrator accounts." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !fullName || password.length < 8) return { error: "Fill in all fields; password must be at least 8 characters." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "A user with this email already exists." };

  const admin = await db.user.create({
    data: { email, fullName, passwordHash: await hashPassword(password), role: "ADMIN", status: "ACTIVE", emailVerifiedAt: new Date() },
  });

  await db.auditLog.create({ data: { actorId: session.user.id, action: "ADMIN_CREATED", entityType: "User", entityId: admin.id } });

  revalidatePath("/admins");
  return { error: null };
}

export async function suspendAdminAction(userId: string) {
  const { session } = await requireAdmin();
  if (session.user.role !== "SUPER_ADMIN") return { ok: false as const, error: "Only a super admin can do this." };
  if (userId === session.user.id) return { ok: false as const, error: "You cannot suspend yourself." };

  await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  await db.auditLog.create({ data: { actorId: session.user.id, action: "ADMIN_SUSPENDED", entityType: "User", entityId: userId } });
  revalidatePath("/admins");
  return { ok: true as const };
}
