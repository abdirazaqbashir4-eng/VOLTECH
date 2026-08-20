"use server";

import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { auth } from "@/auth";

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session?.user) return { ok: false as const };
  await db.notification.updateMany({ where: { userId: session.user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
  return { ok: true as const };
}
