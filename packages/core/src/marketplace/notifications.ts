import type { Prisma } from "@voltech/database";
import { db } from "@voltech/database";
import type { NotificationType } from "../enums";

type Tx = Prisma.TransactionClient;

export async function notify(
  client: Tx | typeof db,
  params: { userId: string; type: NotificationType; title: string; body: string; linkUrl?: string },
) {
  return client.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      linkUrl: params.linkUrl,
    },
  });
}

/** Notify every admin/super-admin — used for marketplace-wide events (new seller application, dispute, etc.). */
export async function notifyAdmins(
  client: Tx | typeof db,
  params: { type: NotificationType; title: string; body: string; linkUrl?: string },
) {
  const admins = await client.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
    select: { id: true },
  });
  await Promise.all(admins.map((a) => notify(client, { ...params, userId: a.id })));
}
