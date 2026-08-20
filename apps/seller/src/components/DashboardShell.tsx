import { signOut } from "@/auth";
import DashboardSidebar from "./DashboardSidebar";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/notifications", label: "Notifications" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/inventory", label: "Inventory" },
  { href: "/analytics", label: "Analytics" },
  { href: "/finance", label: "Finance" },
  { href: "/finance/payouts", label: "Payouts" },
  { href: "/returns", label: "Returns" },
  { href: "/promotions", label: "Promotions" },
  { href: "/settings", label: "Store settings" },
];

export default function DashboardShell({ storeName, children }: { storeName: string; children: React.ReactNode }) {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar storeName={storeName} links={LINKS} onSignOut={handleSignOut} />
      <div className="flex-1 bg-[var(--surface)] p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
