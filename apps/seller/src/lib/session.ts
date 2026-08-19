import { redirect } from "next/navigation";
import { db } from "@voltech/database";
import { auth } from "@/auth";

/** Every seller-dashboard page calls this — it's the actual authorization boundary, not just the proxy. */
export async function requireSeller() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") {
    redirect("/login");
  }
  const seller = await db.sellerProfile.findUnique({ where: { userId: session.user.id } });
  if (!seller) redirect("/login");
  return { session, seller };
}
