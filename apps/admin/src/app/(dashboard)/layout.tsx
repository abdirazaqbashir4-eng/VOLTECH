import { requireAdmin } from "@/lib/session";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session } = await requireAdmin();
  return <DashboardShell name={session.user.name ?? session.user.email ?? "Admin"}>{children}</DashboardShell>;
}
