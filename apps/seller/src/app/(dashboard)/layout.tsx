import { requireSeller } from "@/lib/session";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { seller } = await requireSeller();
  return <DashboardShell storeName={seller.storeName}>{children}</DashboardShell>;
}
