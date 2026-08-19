import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Every admin page calls this — the actual authorization boundary, not just the proxy. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/login");
  }
  return { session };
}
